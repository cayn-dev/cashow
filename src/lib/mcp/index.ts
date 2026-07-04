import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTransactions from "./tools/list-transactions";
import createTransaction from "./tools/create-transaction";
import deleteTransaction from "./tools/delete-transaction";
import monthlySummary from "./tools/monthly-summary";
import listSavingsGoals from "./tools/list-savings-goals";

// Build the OAuth issuer from the project ref (Vite inlines this at build time).
// Fallback keeps the string well-formed during the throwaway manifest-extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "cashow-mcp",
  title: "Cashow",
  version: "0.1.0",
  instructions:
    "Tools for Cashow, an editorial personal-finance app. Use these to read and manage the signed-in user's transactions, savings goals, and monthly summaries. Amounts are in the user's configured currency.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listTransactions,
    createTransaction,
    deleteTransaction,
    monthlySummary,
    listSavingsGoals,
  ],
});
