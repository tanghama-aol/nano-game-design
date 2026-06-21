import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Vite plugins extend the dev server/build pipeline. React enables Fast
  // Refresh and JSX transform; Tailwind scans source classes and emits CSS.
  plugins: [react(), tailwindcss()],
})
