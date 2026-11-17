import { defineConfig } from 'astro/config';

// ponytail: repo will be TakshPanchal.github.io, so no `base` needed.
export default defineConfig({
  site: 'https://takshpanchal.github.io',
  build: { inlineStylesheets: 'always' },
});
