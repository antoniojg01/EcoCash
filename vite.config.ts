import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Substitui referências diretas à API_KEY
    // Vercel usa variáveis de ambiente que podem ser acessadas via process.env
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY || ''),
    // Provê um shim para o objeto process completo, comum em bibliotecas que esperam ambiente Node
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY || '')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
  server: {
    port: 3000,
    host: true
  }
});