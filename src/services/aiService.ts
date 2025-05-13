
import { ContractFormData, ReviewResult } from "@/types";

export class AIService {
  private static apiKey: string | null = null;

  static setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
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
  }

  static async generateContract(
    contractType: string,
    formData: ContractFormData,
    template: string
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("API key not set");
    }

    try {
      console.log("Generating contract with OpenAI...");
      
      // Replace template placeholders with form data
      let contractContent = template;
      Object.keys(formData).forEach(key => {
        const placeholder = `[${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}]`;
        contractContent = contractContent.replace(new RegExp(placeholder, 'g'), formData[key]);
      });
      
      // Prepare prompt for OpenAI
      const prompt = `
        Act as a legal expert specialized in Indonesian law. 
        I need you to create a complete ${contractType} contract based on the following information:
        
        Contract Type: ${contractType}
        
        Form Data:
        ${Object.entries(formData).map(([key, value]) => `${key}: ${value}`).join('\n')}
        
        Initial Template:
        ${contractContent}
        
        Please generate a complete, professional, and legally sound contract following Indonesian law standards.
        The contract should include all standard sections, clauses, terms, and provisions typical for this type of agreement in Indonesia.
        Include references to relevant Indonesian regulations where appropriate.
        Format the output as a properly structured legal document with numbered sections.
        DO NOT include any explanations or commentary - ONLY return the contract text.
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
              content: "You are a legal expert specializing in Indonesian law and contract drafting."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
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
