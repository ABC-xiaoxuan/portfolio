import { rollup } from 'rollup'
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import config from './rollup.config.mjs'

const root = dirname(fileURLToPath(import.meta.url))
process.chdir(root)

if (existsSync('dist')) rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })

const bundle = await rollup({ input: config.input, plugins: config.plugins })
await bundle.write(config.output)
await bundle.close()

// index.html, CSS, fonts and favicon are shipped as static assets.
for (const file of ['index.html', 'styles.css', 'fonts.css', 'favicon.svg']) {
  if (existsSync(file)) cpSync(file, join('dist', file))
}
if (existsSync('fonts')) cpSync('fonts', join('dist', 'fonts'), { recursive: true })

console.log('\n✓ built dist/  (app.js + index.html + styles.css + fonts)')
