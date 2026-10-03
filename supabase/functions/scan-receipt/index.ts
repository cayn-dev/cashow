const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CATEGORIES = [
  "food", "groceries", "restaurant", "transport", "fuel", "shopping",
  "online_shopping", "bills", "utilities", "rent", "entertainment",
  "subscriptions", "health", "pharmacy", "travel", "education",
  "gifts", "insurance", "other",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "missing_image" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing_api_key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    const prompt =
      `You extract structured data from photos of receipts/invoices. Today is ${today}. ` +
      `amount = grand total paid (number, dot decimal). ` +
      `date = the purchase date PRINTED on the receipt (convert any format like DD/MM/YY to ISO YYYY-MM-DD, ` +
      `or YYYY-MM-DDTHH:mm when a time is printed); empty string only if no date is printed. ` +
      `items = up to 6 short names of the purchased products. ` +
      `Choose category by looking at WHAT was bought (e.g. food items at a supermarket = groceries, ` +
      `meals at a bar/restaurant = restaurant, petrol = fuel, medicines = pharmacy). ` +
      `description = a short natural label summarising the purchase in the receipt's language ` +
      `(e.g. "Spesa Esselunga", "Pizza e bibita", "Rifornimento"). ` +
      `merchant = shop name, location = street/city if printed, currency = ISO code. Use empty strings when unknown. ` +
      `paymentMethod = "card" only when the receipt explicitly shows POS, carta/card, bancomat, contactless, Visa, Mastercard or an electronic card payment; ` +
      `"cash" only when it explicitly shows contanti/cash/efectivo/espèces/Bargeld or cash tendered and change; ` +
      `"paypal" or "transfer" only if explicitly printed as the method of payment. ` +
      `Use "unknown" if the payment method is not visible or ambiguous. Do not infer payment method from a merchant, card logo, receipt type or purchase items.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              { type: "input_text", text: "Extract the data from this receipt." },
              { type: "input_image", image_url: image },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "receipt",
            strict: true,
            schema: {
              type: "object",
              properties: {
                amount: { type: "number" },
                description: { type: "string" },
                category: { type: "string", enum: CATEGORIES },
                date: { type: "string" },
                merchant: { type: "string" },
                location: { type: "string" },
                currency: { type: "string" },
                items: { type: "array", items: { type: "string" } },
                paymentMethod: { type: "string", enum: ["card", "cash", "paypal", "transfer", "unknown"] },
              },
              required: ["amount", "description", "category", "date", "merchant", "location", "currency", "items", "paymentMethod"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limit" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402 || res.status === 403) {
      return new Response(JSON.stringify({ error: "payment_required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const text = await res.text();
      console.error("gateway error", res.status, text);
      return new Response(JSON.stringify({ error: "gateway_error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Consume SSE stream, collecting output text
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "", refused = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
          if (ev.type === "response.refusal.delta") refused = true;
        } catch { /* ignore */ }
      }
    }

    let parsed: Record<string, unknown>;
    try {
      if (refused) throw new Error("refused");
      parsed = JSON.parse(out);
    } catch {
      return new Response(JSON.stringify({ error: "no_data" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const k of Object.keys(parsed)) if (parsed[k] === "") delete parsed[k];

    return new Response(JSON.stringify({ receipt: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-receipt failed", e);
    return new Response(JSON.stringify({ error: "unexpected" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
