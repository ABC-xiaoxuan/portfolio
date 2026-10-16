import { rollup } from 'rollup'
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import config from './rollup.config.mjs'

const root = dirname(fileURLToPath(import.meta.url))
process.chdir(root)

// Absolute origin for canonical / og:url. The *.vercel.app URL sits behind Vercel
// login, so the public custom domain is the default; SITE_URL overrides it.
const productionHost = process.env.SITE_URL || 'www.dongwangxing.online'
const siteUrl = (/^https?:\/\//.test(productionHost) ? productionHost : `https://${productionHost}`).replace(/\/$/, '')

for (const dir of ['dist', '.smoke']) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
}
mkdirSync('dist', { recursive: true })

const bundle = await rollup({ input: config.input, plugins: config.plugins })
await bundle.write(config.output)
await bundle.write(config.smokeOutput)
await bundle.close()

// CSS, fonts, favicon and the downloadable assets are shipped as static files.
for (const file of ['styles.css', 'fonts.css', 'favicon.svg', 'og.png', 'resume.pdf']) {
  if (existsSync(file)) cpSync(file, join('dist', file))
}
if (existsSync('fonts')) cpSync('fonts', join('dist', 'fonts'), { recursive: true })
writeFileSync(join('dist', 'index.html'), readFileSync('index.html', 'utf8').replaceAll('%SITE_URL%', siteUrl))

console.log(`\n✓ built dist/  (app.js + chunks/ + index.html + styles.css + fonts)  site: ${siteUrl}`)
