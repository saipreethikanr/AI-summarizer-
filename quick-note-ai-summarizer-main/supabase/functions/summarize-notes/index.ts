
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
    const { notes } = await req.json();

    if (!nvidiApiKey) {
      throw new Error('NVIDIA API key not configured');
    }

    const summaries = [];

    for (const note of notes) {
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
              content: 'You are a helpful assistant that creates very brief summaries. Provide a concise 1-2 sentence summary in plain text without any formatting or special characters.'
            },
            {
              role: 'user',
              content: `Please summarize the following text in 1-2 sentences (not bullet points): "${note.title}":\n\n${note.content}`
            }
          ],
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const summary = data.choices[0].message.content;
        summaries.push(`• ${note.title}: ${summary}`);
      } else {
        summaries.push(`• ${note.title}: Unable to summarize this note.`);
      }
    }

    const combinedSummary = summaries.join("\n\n");

    return new Response(JSON.stringify({ summary: combinedSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in summarize-notes function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
