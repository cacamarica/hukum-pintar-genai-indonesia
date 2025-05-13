
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractType, formData, templateSample, userId } = await req.json();
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the user's OpenAI API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('openai_key')
      .eq('user_id', userId)
      .single();
    
    if (apiKeyError || !apiKeyData) {
      console.error("Error fetching API key:", apiKeyError);
      return new Response(
        JSON.stringify({ error: "API key not found" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const openAIApiKey = apiKeyData.openai_key;
    
    // Replace template placeholders with form data
    let contractContent = templateSample;
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

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIApiKey}`,
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
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: `API request failed with status ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Save the generated contract to the database
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .insert({
        user_id: userId,
        contract_type: contractType,
        title: `${contractType} Contract - ${new Date().toLocaleDateString('en-US')}`,
        content: generatedContent,
        form_data: formData
      })
      .select('id')
      .single();
      
    if (contractError) {
      console.error("Error saving contract:", contractError);
    }

    return new Response(
      JSON.stringify({ 
        content: generatedContent, 
        contractId: contractData?.id || null 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error generating contract:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
