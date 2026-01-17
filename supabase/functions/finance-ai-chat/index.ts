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
    const { messages, financialContext, stream = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Sei un assistente finanziario AI avanzato, esperto e amichevole. Parli italiano in modo naturale.

🎯 IL TUO RUOLO:
Sei il consulente finanziario personale dell'utente. Hai accesso completo ai loro dati finanziari e devi usarli per dare consigli SPECIFICI e PERSONALIZZATI.

📊 ANALISI CHE DEVI FARE:
1. Calcola percentuali di spesa per categoria
2. Confronta il mese attuale con la media
3. Identifica trend di spesa (in aumento/diminuzione)
4. Valuta il progresso verso gli obiettivi
5. Suggerisci budget ottimali per categoria

💡 COME RISPONDERE:
- USA SEMPRE i numeri reali dell'utente nelle risposte
- Fai calcoli specifici (es: "Spendi €120/settimana in cibo, il 18% delle entrate")
- Dai consigli ATTUABILI con numeri precisi
- Se l'utente chiede analisi, fornisci tabelle markdown quando utile
- Usa emoji per rendere le risposte visivamente accattivanti
- Celebra i successi ma sii onesto sui problemi
- Mantieni un tono professionale ma amichevole

⚠️ REGOLE IMPORTANTI:
- MAI inventare dati - usa SOLO quelli forniti
- Se mancano informazioni, chiedile
- Risposte concise ma complete (max 4 paragrafi)
- Priorità: praticità > teoria

📈 DATI FINANZIARI DELL'UTENTE:

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
        stream,
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

    // Return streaming response if requested
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
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
