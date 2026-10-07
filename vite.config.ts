import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas: el sitio funciona en https://<usuario>.github.io/<repositorio>/
  // sin tener que escribir aquí el nombre del repositorio.
  base: './',
  plugins: [svelte()],
})
