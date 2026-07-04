import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_transactions",
  title: "List transactions",
  description:
    "List the signed-in user's Cashow transactions. Optional filters: type (income/expense), category, from/to ISO dates, and limit (default 50, max 500).",
  inputSchema: {
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().optional(),
    from: z.string().optional().describe("ISO date (inclusive)"),
    to: z.string().optional().describe("ISO date (inclusive)"),
    limit: z.number().int().min(1).max(500).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ type, category, from, to, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    let q = sb(ctx)
      .from("transactions")
      .select("id,type,amount,category,description,date,payment_method,is_salary")
      .eq("user_id", ctx.getUserId())
      .order("date", { ascending: false })
      .limit(limit ?? 50);

    if (type) q = q.eq("type", type);
    if (category) q = q.eq("category", category);
    if (from) q = q.gte("date", from);
    if (to) q = q.lte("date", to);

    const { data, error } = await q;
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { transactions: data },
    };
  },
});
