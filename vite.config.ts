import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves at /<repo>/, so set base accordingly.
  // If deploying somewhere else (Vercel/Netlify), you can remove this.
  base: '/SmartBundle/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
