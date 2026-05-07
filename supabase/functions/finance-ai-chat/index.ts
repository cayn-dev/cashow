import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, financialContext, stream = false, language = 'it' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const langInstr: Record<string, string> = {
      it: "Rispondi sempre in italiano in modo naturale.",
      en: "Always reply in English.",
      es: "Responde siempre en español.",
      fr: "Réponds toujours en français.",
      de: "Antworte immer auf Deutsch.",
    };

    const systemPrompt = `You are Cashow's advanced AI financial assistant. ${langInstr[language] || langInstr.it}

ROLE: Personal financial advisor with full access to user data. Give SPECIFIC, PERSONALIZED advice with real numbers.

ANALYSIS:
1. Calculate spending percentages by category
2. Compare current vs average
3. Identify trends (rising/falling)
4. Evaluate goal progress
5. Suggest optimal budgets

HOW TO ANSWER:
- Always use real user numbers
- Make specific calculations (e.g. "you spend €120/week on food, 18% of income")
- Actionable advice with precise numbers
- Use markdown tables when useful
- Use emojis to make responses lively
- Celebrate wins, be honest about issues
- Concise but complete (max 4 paragraphs)

USER FINANCIAL DATA:
${financialContext || 'No data provided yet.'}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "Sorry, no response.";

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("finance-ai-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
