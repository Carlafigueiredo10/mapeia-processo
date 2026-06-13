import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: em produção o site é publicado em GitHub Pages como projeto
// (https://<usuario>.github.io/mapeia-processo/). Em dev/preview fica em '/'.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/mapeia-processo/' : '/',
  plugins: [react()],
}))
