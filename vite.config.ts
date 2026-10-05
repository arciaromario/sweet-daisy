import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH lets the same build run at a domain root ("/") or under a sub-path,
// e.g. "/cloud_cakes/" for GitHub Pages project sites.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});
