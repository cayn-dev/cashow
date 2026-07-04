// Types for MCP tool files that run under Deno at runtime but are
// type-checked here under a DOM-only lib.
declare global {
  const process: { env: Record<string, string | undefined> };
}
export {};
