import { copyFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const distDir = resolve('dist')

// GitHub Pages SPA fallback:
// Serve the same app shell for unknown routes by copying index.html to 404.html.
await copyFile(resolve(distDir, 'index.html'), resolve(distDir, '404.html'))

// Disable Jekyll processing (helps prevent issues with files/folders that start with underscores).
await writeFile(resolve(distDir, '.nojekyll'), '')
