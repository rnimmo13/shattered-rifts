import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      'cloudflare:workers': fileURLToPath(
        new URL('./tools/testing/cloudflare.mjs', import.meta.url),
      ),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'tools/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
    environment: 'node',
    // (a run is 45 floors, and some tests walk thousands of them on a machine busy with the rest)
    testTimeout: 30000,
  },
});
