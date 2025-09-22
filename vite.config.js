import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 👇 Cambia esta línea si el nombre del repo es distinto
  base: '/Nfc_PokeDex/',
  build: {
    outDir: 'docs', // 👉 el build sale a /docs para que Pages lo sirva
    emptyOutDir: true
  },
})