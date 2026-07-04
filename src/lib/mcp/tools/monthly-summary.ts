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
  name: "monthly_summary",
  title: "Monthly summary",
  description:
    "Return the signed-in user's income, expenses, balance and per-category breakdown for a given month (YYYY-MM, defaults to current month).",
  inputSchema: {
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .describe("YYYY-MM, defaults to current month"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ month }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const now = new Date();
    const ym = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [y, m] = ym.split("-").map(Number);
    const from = `${ym}-01`;
    const to = new Date(y, m, 0).toISOString().slice(0, 10);

    const { data, error } = await sb(ctx)
      .from("transactions")
      .select("type,amount,category")
      .eq("user_id", ctx.getUserId())
      .gte("date", from)
      .lte("date", to);

    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };

    let income = 0,
      expenses = 0;
    const byCategory: Record<string, number> = {};
    for (const t of data ?? []) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") income += amt;
      else {
        expenses += amt;
        byCategory[t.category] = (byCategory[t.category] ?? 0) + amt;
      }
    }
    const summary = {
      month: ym,
      income,
      expenses,
      balance: income - expenses,
      expensesByCategory: byCategory,
      count: data?.length ?? 0,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
