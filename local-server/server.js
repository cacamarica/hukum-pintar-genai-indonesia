import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = 54321; // Same port as Supabase functions use by default

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
}));

// Increase the limit for JSON body parsing to handle larger requests
app.use(express.json({ limit: '50mb' }));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mock endpoint for generate-contract function
app.post('/functions/v1/generate-contract', async (req, res) => {
  try {
    const { contractType, formData, templateSample, userId } = req.body;
    
    console.log('Received contract generation request:', {
      contractType,
      userId,
      formDataKeys: Object.keys(formData)
    });
    
    // Connect to Supabase to get the user's OpenAI API key
    // In a real implementation, you would use the Supabase client here
    // For now, we'll just use the API key from the request or an environment variable
    
    // Get API key from database (simplified for local development)
    // In production, this would be retrieved from your Supabase database
    const apiKeyFromRequest = req.headers.authorization?.split('Bearer ')[1];
    const openAIApiKey = apiKeyFromRequest || process.env.OPENAI_API_KEY;
    
    if (!openAIApiKey) {
      console.error('No API key available');
      return res.status(400).json({
        error: "API key not found. Make sure you've set your OpenAI API key in the application."
      });
    }
    
    // Replace template placeholders with form data
    let contractContent = templateSample || '';
    Object.keys(formData).forEach(key => {
      const placeholder = `[${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}]`;
      contractContent = contractContent.replace(new RegExp(placeholder, 'g'), formData[key]);
    });
    
    // Trim the contract content if it's too long (to avoid memory issues)
    const maxTemplateLength = 15000; // Characters
    if (contractContent.length > maxTemplateLength) {
      console.log(`Template too large (${contractContent.length} chars), truncating to ${maxTemplateLength} chars`);
      contractContent = contractContent.substring(0, maxTemplateLength) + '...';
    }
    
    // Create a more concise prompt to save memory
    const formDataText = Object.entries(formData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    // Prepare prompt for OpenAI
    const prompt = `
      Act as a legal expert specialized in Indonesian law. 
      Create a ${contractType} contract based on:
      
      Contract Type: ${contractType}
      
      Form Data:
      ${formDataText}
      
      Initial Template (if incomplete, expand appropriately):
      ${contractContent}
      
      Generate a complete, professional contract following Indonesian law standards.
      Include standard sections, clauses, terms typical for this type of agreement.
      Reference relevant Indonesian regulations where appropriate.
      Format as a legal document with numbered sections.
      ONLY return the contract text.
    `;

    console.log('Calling OpenAI API...');
    
    try {
      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIApiKey}`,
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
          max_tokens: 2500 // Reduce max tokens to prevent memory issues
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        return res.status(400).json({ 
          error: `OpenAI API request failed with status ${response.status}. Check your API key and try again.`
        });
      }

      const data = await response.json();
      const generatedContent = data.choices[0].message.content;
      
      console.log('Contract generated successfully!');
      
      // In a real implementation, we would save to Supabase here
      // For now, just return the generated contract
      res.json({ 
        content: generatedContent, 
        contractId: `local-${Date.now()}`  // Generate a fake ID since we're not saving to a database
      });
    } catch (apiError) {
      console.error("Error calling OpenAI API:", apiError);
      res.status(500).json({ 
        error: `Failed to generate contract: ${apiError.message}`,
        details: "OpenAI API call failed"
      });
    }
    
  } catch (error) {
    console.error("Error generating contract:", error);
    res.status(500).json({ 
      error: "Failed to generate contract. Please try again.",
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(port, () => {
  console.log(`Local server running at http://localhost:${port}`);
  console.log(`Contract generation endpoint: http://localhost:${port}/functions/v1/generate-contract`);
});