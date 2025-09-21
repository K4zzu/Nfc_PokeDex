import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react()],
  base: '/Nfc_PokeDex/', // <-- cambia a '/' si despliegas en k4zzu.github.io (user site)
})