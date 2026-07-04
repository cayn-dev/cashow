// Types for MCP tool files that will run under Deno at runtime but are
// type-checked here under a DOM-only lib. `process.env` is populated by the
// Supabase Edge Function bundler at deploy time.
declare const process: { env: Record<string, string | undefined> };
