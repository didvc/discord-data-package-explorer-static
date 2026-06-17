import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    // Ensure fully static output for GH Pages
  },
  // For GitHub Pages project site, set base if repo name != username.github.io
  // e.g. base: '/discord-data-package-explorer-static/',
  base: './',
});