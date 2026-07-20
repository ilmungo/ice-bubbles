import { defineConfig } from 'vite';

// GitHub Pages serves this project from /ice-bubbles/, so asset URLs need
// that prefix in production. Keep it '/' for local dev.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/ice-bubbles/' : '/',
});
