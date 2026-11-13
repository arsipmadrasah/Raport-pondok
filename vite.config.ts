import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-guru-html',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist');
        const guruDir = path.resolve(distDir, 'guru');
        const indexHtml = path.resolve(distDir, 'index.html');
        if (fs.existsSync(indexHtml)) {
          fs.mkdirSync(guruDir, { recursive: true });
          fs.copyFileSync(indexHtml, path.resolve(guruDir, 'index.html'));
          fs.copyFileSync(indexHtml, path.resolve(distDir, 'guru.html'));
        }
      }
    }
  ],
  server: {
    port: 3000,
    open: false,
    host: true
  }
});
