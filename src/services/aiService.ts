
import { ContractFormData, ReviewResult } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export class AIService {
  private static apiKey: string | null = null;

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
      
      console.log("Generating contract with OpenAI via edge function...");
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("User authentication required");
      }
      
      // Call our edge function
      const { data, error } = await supabase.functions.invoke('generate-contract', {
        body: {
          contractType,
          formData,
          templateSample: template,
          userId: user.id
        }
      });
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(`Failed to generate contract: ${error.message}`);
      }
      
      if (!data || !data.content) {
        throw new Error("No content returned from the edge function");
      }
      
      return data.content;
    } catch (error) {
      console.error("Error generating contract:", error);
      throw new Error("Failed to generate contract. Please try again.");
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
}
