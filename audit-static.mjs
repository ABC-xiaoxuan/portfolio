import { readFileSync, existsSync } from 'node:fs'

const css = readFileSync('styles.css', 'utf8')
const jsx = readFileSync('src/App.jsx', 'utf8')
const index = readFileSync('index.html', 'utf8')
const motionHook = readFileSync('src/hooks/useReducedMotion.js', 'utf8')
const checks = [
  ['React mount point', index.includes('id="root"')],
  ['React entry bundle', index.includes('./app.js')],
  ['legacy page sections retained', ['#work', '#experience', '#skills', '#contact'].every((id) => jsx.includes(id))],
  ['single h1', (jsx.match(/<h1/g) || []).length === 1],
  ['reduced motion CSS', css.includes('prefers-reduced-motion: reduce')],
  ['reduced motion JS', jsx.includes('useReducedMotion') && motionHook.includes('prefers-reduced-motion')],
  ['entry loads as an ES module', index.includes('<script type="module" src="./app.js">')],
  ['responsive layout', css.includes('@media (max-width: 760px)')],
  ['focus styles', css.includes(':focus-visible')],
  ['font assets', existsSync('fonts/noto-sans-sc.woff2') && existsSync('fonts/geist.woff2') && existsSync('fonts/geist-mono.woff2')],
]
const failed = checks.filter(([, passed]) => !passed)
console.log(`STATIC AUDIT — ${failed.length} errors, 0 warnings\n`)
for (const [name, passed] of checks) console.log(`  ${passed ? '✓' : '✗'} ${name}`)
process.exitCode = failed.length ? 1 : 0
