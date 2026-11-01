import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'tools/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
    environment: 'node',
    // (a run is 45 floors, and some tests walk thousands of them on a machine busy with the rest)
    testTimeout: 30000,
  },
});
