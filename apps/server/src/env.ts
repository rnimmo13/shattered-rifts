/** What the Worker is given by Cloudflare (see wrangler.jsonc). */
export interface Env {
  MATCHMAKER: DurableObjectNamespace;
  MATCH: DurableObjectNamespace;
  VAULT: DurableObjectNamespace;
  BOARD: DurableObjectNamespace;
  /** secrets, set in the Cloudflare dashboard (never in the repo); sign-in is off until all three exist */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
  STEAM_APP_ID?: string;
  /** Publisher Web API key. Server secret only; never bundled with a desktop build. */
  STEAM_WEB_API_KEY?: string;
}
