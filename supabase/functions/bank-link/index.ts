import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GC = "https://bankaccountdata.gocardless.com/api/v2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function gcToken(): Promise<string> {
  const secret_id = Deno.env.get("GOCARDLESS_SECRET_ID");
  const secret_key = Deno.env.get("GOCARDLESS_SECRET_KEY");
  if (!secret_id || !secret_key) throw new Error("GoCardless credentials not configured");
  const res = await fetch(`${GC}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret_id, secret_key }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`[${res.status}] ${body}`);
  return JSON.parse(body).access;
}

async function gc(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${GC}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`[${res.status}] ${text}`);
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    const { action, ...params } = await req.json();
    const token = await gcToken();

    if (action === "institutions") {
      const country = (params.country || "it").toLowerCase();
      const list = await gc(`/institutions/?country=${country}`, token);
      return json({
        institutions: (list || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          logo: i.logo,
        })),
      });
    }

    if (action === "connect") {
      const { institutionId, institutionName, institutionLogo, redirect } = params;
      if (!institutionId || !redirect) return json({ error: "missing_params" }, 400);

      const agreement = await gc("/agreements/enduser/", token, {
        method: "POST",
        body: JSON.stringify({
          institution_id: institutionId,
          max_historical_days: 90,
          access_valid_for_days: 90,
          access_scope: ["balances", "details", "transactions"],
        }),
      });

      const requisition = await gc("/requisitions/", token, {
        method: "POST",
        body: JSON.stringify({
          redirect,
          institution_id: institutionId,
          agreement: agreement.id,
          user_language: "IT",
        }),
      });

      await supabase.from("bank_connections").insert({
        user_id: user.id,
        requisition_id: requisition.id,
        institution_id: institutionId,
        institution_name: institutionName ?? null,
        institution_logo: institutionLogo ?? null,
        status: "pending",
      });

      return json({ link: requisition.link, requisitionId: requisition.id });
    }

    if (action === "sync") {
      const { requisitionId } = params;
      let query = supabase.from("bank_connections").select("*").eq("user_id", user.id);
      if (requisitionId) query = query.eq("requisition_id", requisitionId);
      const { data: connections, error } = await query;
      if (error) throw error;

      let imported = 0;
      for (const conn of connections || []) {
        let req: any;
        try {
          req = await gc(`/requisitions/${conn.requisition_id}/`, token);
        } catch (_e) {
          await supabase.from("bank_connections").update({ status: "expired" })
            .eq("id", conn.id).eq("user_id", user.id);
          continue;
        }

        const accountIds: string[] = req.accounts || [];
        if (!accountIds.length) continue;

        for (const accId of accountIds) {
          let details: any = {};
          let balance = 0;
          try {
            const d = await gc(`/accounts/${accId}/details/`, token);
            details = d?.account || {};
            const b = await gc(`/accounts/${accId}/balances/`, token);
            const first = (b?.balances || [])[0];
            balance = Number(first?.balanceAmount?.amount ?? 0);
          } catch (_e) { /* keep defaults */ }

          const name = details.name || details.ownerName || conn.institution_name || "Conto";
          const currency = details.currency || "EUR";

          const { data: existing } = await supabase
            .from("bank_accounts")
            .select("id")
            .eq("user_id", user.id)
            .eq("external_account_id", accId)
            .maybeSingle();

          if (existing) {
            await supabase.from("bank_accounts")
              .update({ current_balance: balance, name, currency })
              .eq("id", existing.id).eq("user_id", user.id);
          } else {
            await supabase.from("bank_accounts").insert({
              user_id: user.id,
              name,
              type: "checking",
              bank_name: conn.institution_name,
              icon: "building-2",
              color: "#3B82F6",
              initial_balance: balance,
              current_balance: balance,
              currency,
              is_active: true,
              provider: "gocardless",
              external_account_id: accId,
              connection_id: conn.id,
            });
            imported++;
          }
        }

        await supabase.from("bank_connections")
          .update({ status: req.status === "LN" ? "linked" : "pending", last_synced_at: new Date().toISOString() })
          .eq("id", conn.id).eq("user_id", user.id);
      }

      return json({ ok: true, imported });
    }

    if (action === "disconnect") {
      const { connectionId } = params;
      const { data: conn } = await supabase.from("bank_connections")
        .select("*").eq("id", connectionId).eq("user_id", user.id).maybeSingle();
      if (!conn) return json({ error: "not_found" }, 404);
      try {
        await gc(`/requisitions/${conn.requisition_id}/`, token, { method: "DELETE" });
      } catch (_e) { /* already gone upstream */ }
      await supabase.from("bank_connections").delete().eq("id", conn.id).eq("user_id", user.id);
      return json({ ok: true });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("bank-link error:", message);
    return json({ error: "bank_link_failed", details: message }, 500);
  }
});
