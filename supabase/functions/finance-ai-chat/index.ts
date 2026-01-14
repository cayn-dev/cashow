import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, financialContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Sei un assistente finanziario personale esperto e amichevole. Parli italiano.

Il tuo compito è:
1. Analizzare i dati finanziari dell'utente che ti vengono forniti
2. Dare consigli personalizzati basati sulle loro abitudini di spesa
3. Suggerire modi per risparmiare e raggiungere i loro obiettivi
4. Rispondere a domande sulle loro finanze in modo chiaro e utile
5. Identificare pattern di spesa e aree di miglioramento

Regole importanti:
- Sii sempre positivo e incoraggiante, anche quando devi segnalare problemi
- Usa emoji per rendere le risposte più amichevoli 💰
- Dai consigli pratici e attuabili
- Se noti spese eccessive in una categoria, suggerisci alternative
- Celebra i progressi verso gli obiettivi di risparmio
- Mantieni le risposte concise ma utili (massimo 3-4 paragrafi)

Ecco i dati finanziari attuali dell'utente:

${financialContext}`;

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppe richieste. Riprova tra poco." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti. Aggiungi crediti nelle impostazioni." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Errore del gateway AI");
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "Mi dispiace, non sono riuscito a elaborare la risposta.";

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("finance-ai-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
