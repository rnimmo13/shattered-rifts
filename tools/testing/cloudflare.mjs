// Vitest-only base class. Production resolves cloudflare:workers through the Worker runtime.
export class DurableObject {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }
}
