/** What the Worker is given by Cloudflare (see wrangler.jsonc). */
export interface Env {
  MATCHMAKER: DurableObjectNamespace;
  MATCH: DurableObjectNamespace;
  VAULT: DurableObjectNamespace;
}
