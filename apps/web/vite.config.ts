import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /<repo>/, so deploys set SR_BASE (see tools/src/deploy.ts).
export default defineConfig({
  base: process.env['SR_BASE'] ?? '/',
  plugins: [react()],
});
