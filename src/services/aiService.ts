import { ContractFormData, ReviewResult } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export class AIService {
  private static apiKey: string | null = null;

  // Environment variables
  private static LOCAL_SERVER_URL = "http://localhost:54321";
  private static USE_LOCAL_SERVER = true; // Set to true to use local server instead of Supabase functions

  static setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
    
    // If user is authenticated, save the API key to Supabase
    const user = supabase.auth.getUser();
    user.then(({ data }) => {
      if (data?.user) {
        // Check if the user already has an API key stored
        supabase
          .from('api_keys')
          .select('*')
          .eq('user_id', data.user.id)
          .then(({ data: existingKeys, error }) => {
            if (error) {
              console.error("Error checking existing API keys:", error);
              return;
            }
            
            if (existingKeys && existingKeys.length > 0) {
              // Update existing API key
              supabase
                .from('api_keys')
                .update({ openai_key: key, updated_at: new Date() })
                .eq('user_id', data.user.id)
                .then(({ error }) => {
                  if (error) console.error("Error updating API key:", error);
                });
            } else {
              // Insert new API key
              supabase
                .from('api_keys')
                .insert({ user_id: data.user.id, openai_key: key })
                .then(({ error }) => {
                  if (error) console.error("Error saving API key:", error);
                });
            }
          });
      }
    });
  }

  static getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('openai_api_key');
    }
    return this.apiKey;
  }

  static clearApiKey(): void {
    this.apiKey = null;
    localStorage.removeItem('openai_api_key');
    
    // If user is authenticated, remove API key from Supabase
    const user = supabase.auth.getUser();
    user.then(({ data }) => {
      if (data?.user) {
        supabase
          .from('api_keys')
          .delete()
          .eq('user_id', data.user.id)
          .then(({ error }) => {
            if (error) console.error("Error deleting API key:", error);
          });
      }
    });
  }

  static async checkApiKey(): Promise<{ valid: boolean; message: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { 
        valid: false, 
        message: "API key not found. Please set your OpenAI API key." 
      };
    }

    try {
      console.log("Verifying OpenAI API key...");
      
      // Make a minimal API call to OpenAI to validate the key
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API key validation failed:", error);
        return { 
          valid: false, 
          message: `API key validation failed: ${error.error?.message || response.statusText}` 
        };
      }

      // If we get a successful response, the key is valid
      return { 
        valid: true, 
        message: "OpenAI API key is valid and connection successful." 
      };
    } catch (error) {
      console.error("Error checking API key:", error);
      return { 
        valid: false, 
        message: `Error checking API key: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  static async generateContract(
    contractType: string,
    formData: ContractFormData,
    template: string
  ): Promise<string> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        throw new Error("API key not set");
      }
      
      console.log("Generating contract with OpenAI...");
      
      // Get current user
      let userId = 'anonymous';
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          userId = data.user.id;
        }
      } catch (userError) {
        // Just log the error and continue with anonymous user
        console.log("Auth info: Using anonymous user for contract generation");
      }
      
      // Limit template size to prevent memory issues
      let templateToUse = template;
      const maxTemplateLength = 25000; // Characters
      if (templateToUse && templateToUse.length > maxTemplateLength) {
        console.warn(`Template too large (${templateToUse.length} chars), truncating to ${maxTemplateLength} chars`);
        templateToUse = templateToUse.substring(0, maxTemplateLength) + '...';
      }
      
      if (this.USE_LOCAL_SERVER) {
        console.log("Using local server for contract generation...");
        
        // Call our local server implementation with error handling
        try {
          // Set up timeout for the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 120000); // 120-second timeout
          
          const response = await fetch(`${this.LOCAL_SERVER_URL}/functions/v1/generate-contract`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              contractType,
              formData,
              templateSample: templateToUse,
              userId
            }),
            signal: controller.signal
          });
          
          // Clear the timeout
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            let errorMessage = `Failed to generate contract: ${response.statusText}`;
            try {
              const errorData = await response.json();
              console.error("Local server error:", errorData);
              errorMessage = errorData.error || errorMessage;
              
              // Check for specific memory-related errors
              if (errorMessage.includes("memory") || response.status === 500) {
                errorMessage = "Contract generation failed due to memory limitations. Please try with a smaller template or fewer details.";
              }
            } catch (jsonError) {
              // If we can't parse the error response, use the default message
            }
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          
          if (!data || !data.content) {
            throw new Error("No content returned from the local server");
          }
          
          return data.content;
        } catch (fetchError) {
          console.error("Connection error:", fetchError);
          
          if (fetchError.name === 'AbortError') {
            throw new Error("Request timed out. Please check if the local server is running and try again.");
          }
          
          // Provide more helpful error messages for common issues
          if (fetchError.message.includes("Failed to fetch")) {
            throw new Error(`Cannot connect to local server. Please make sure the server is running on port 54321.`);
          }
          
          throw new Error(`Error generating contract: ${fetchError.message}`);
        }
        
      } else {
        // Use original Supabase functions implementation
        const { data: funcData, error } = await supabase.functions.invoke('generate-contract', {
          body: {
            contractType,
            formData,
            templateSample: template,
            userId
          }
        });
        
        if (error) {
          console.error("Edge function error:", error);
          throw new Error(`Failed to generate contract: ${error.message}`);
        }
        
        if (!funcData || !funcData.content) {
          throw new Error("No content returned from the edge function");
        }
        
        return funcData.content;
      }
    } catch (error) {
      console.error("Error generating contract:", error);
      throw error; // Forward the specific error message
    }
  }

  static async reviewContract(contractText: string): Promise<ReviewResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("API key not set");
    }

    try {
      console.log("Reviewing contract with OpenAI...");
      
      const prompt = `
        Act as a legal expert specialized in Indonesian law. Please review the following contract for:
        
        1. Potential legal issues or risks under Indonesian law
        2. Missing clauses or information
        3. Suggestions for improvements
        4. Compliance with Indonesian regulations
        
        Contract Text:
        ${contractText}
        
        Provide your analysis in the following JSON format:
        {
          "suggestions": ["suggestion1", "suggestion2", ...],
          "risks": ["risk1", "risk2", ...],
          "completeness": 85, // percentage of completeness
          "revisedContent": "revised contract text if necessary"
        }
        
        Return ONLY the JSON response, no additional text.
      `;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a legal expert specializing in Indonesian law and contract review."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        // Extract JSON from the response
        const jsonMatch = content.match(/({[\s\S]*})/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        return JSON.parse(jsonString);
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        return {
          suggestions: ["AI response format error, please try again"],
          risks: ["Unable to analyze risks due to response format error"],
          completeness: 0
        };
      }
    } catch (error) {
      console.error("Error reviewing contract:", error);
      throw new Error("Failed to review contract. Please try again.");
    }
  }

  static async reviseContract(
    currentContract: string,
    userInstructions: string,
    contractType: string
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("API key not set");
    }

    try {
      console.log("Revising contract with OpenAI based on instructions...");
      
      const prompt = `
        You are a legal expert specialized in Indonesian law. I have a contract that needs to be revised according to specific instructions.

        Current contract:
        ${currentContract}

        Revision instructions:
        ${userInstructions}

        Please provide the complete revised contract text based on these instructions. 
        Maintain a professional legal tone and ensure the contract remains valid under Indonesian law.
        The contract is of type: ${contractType}
        
        Return only the complete revised contract. Do not include any explanations or notes outside the contract text.
      `;

      // Set up timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a legal expert specializing in Indonesian law and contract drafting."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        }),
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const revisedContract = data.choices[0].message.content.trim();
      
      return revisedContract;
    } catch (error) {
      console.error("Error revising contract:", error);
      
      if (error.name === 'AbortError') {
        throw new Error("Request timed out. Please try again with simpler instructions.");
      }
      
      throw new Error(`Failed to revise contract: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
