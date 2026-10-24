/** What the Worker is given by Cloudflare (see wrangler.jsonc). */
export interface Env {
  MATCHMAKER: DurableObjectNamespace;
  MATCH: DurableObjectNamespace;
  VAULT: DurableObjectNamespace;
  /** secrets, set in the Cloudflare dashboard (never in the repo); sign-in is off until all three exist */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
}
