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
  name: "create_transaction",
  title: "Create transaction",
  description:
    "Add a new income or expense transaction to Cashow for the signed-in user.",
  inputSchema: {
    type: z.enum(["income", "expense"]),
    amount: z.number().positive(),
    category: z.string().describe("Category slug, e.g. groceries, salary, rent"),
    description: z.string().min(1),
    date: z.string().optional().describe("ISO date; defaults to today"),
    payment_method: z
      .enum(["cash", "card", "paypal", "transfer", "other"])
      .optional(),
    is_salary: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx)
      .from("transactions")
      .insert({
        user_id: ctx.getUserId(),
        type: input.type,
        amount: input.amount,
        category: input.category,
        description: input.description,
        date: input.date ?? new Date().toISOString().slice(0, 10),
        payment_method: input.payment_method ?? "card",
        is_salary: input.is_salary ?? false,
      })
      .select()
      .single();
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created transaction ${data.id}` }],
      structuredContent: { transaction: data },
    };
  },
});
