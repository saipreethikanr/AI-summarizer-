import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const nvidiApiKey = Deno.env.get('NVIDIA_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!nvidiApiKey) {
      throw new Error('NVIDIA API key not configured');
    }

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nvidiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates clear, concise summaries. Provide a summary in plain text format with bullet points for key information. Use simple language and avoid any formatting like bold, italics, or markdown. Focus on capturing the main points in 2-3 sentences followed by bullet points for details.'
          },
          {
            role: 'user',
            content: `Please summarize the following text in 1-2 sentences (not bullet points):\n\n${content}`
          }
        ],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in summarize-note function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
