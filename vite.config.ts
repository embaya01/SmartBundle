import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@smartbundle/shared/',
        replacement: resolve(__dirname, 'packages/shared/src/') + '/',
      },
      {
        find: '@smartbundle/shared',
        replacement: resolve(__dirname, 'packages/shared/src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'packages/shared/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
