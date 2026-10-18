import { JSDOM, VirtualConsole } from 'jsdom'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const errors = []
const passed = []
const vc = new VirtualConsole()
vc.on('jsdomError', (error) => errors.push(`jsdomError: ${error.message}`))
vc.on('error', (...args) => errors.push(`console.error: ${args.join(' ')}`))

// jsdom cannot run module scripts, so swap in the inlined classic build.
const entry = '<script type="module" src="./app.js"></script>'
const source = readFileSync('dist/index.html', 'utf8')
if (!source.includes(entry)) throw new Error('dist/index.html no longer loads ./app.js as a module')
const html = source.replace(entry, '<script src="../.smoke/app.js" defer></script>')
const dom = new JSDOM(html, {
  url: `file://${resolve('dist/index.html').replace(/\\/g, '/')}`,
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  beforeParse: (window) => {
    window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }))
  },
  virtualConsole: vc,
})
const { window } = dom
const check = (name, fn) => {
  try {
    if (fn() === false) errors.push(`FAIL ${name}`)
    else passed.push(name)
  } catch (error) {
    errors.push(`THREW ${name}: ${error.message}`)
  }
}

await new Promise((resolveLoad) => {
  if (window.document.readyState === 'complete') resolveLoad()
  else window.addEventListener('load', resolveLoad, { once: true })
})
await new Promise((resolveRender) => setTimeout(resolveRender, 400))

const doc = window.document
const text = doc.body.textContent || ''
check('bundle executed without runtime errors', () => errors.length === 0)
check('React root rendered', () => !!doc.querySelector('#root'))
check('legacy hero rendered', () => doc.querySelector('h1')?.getAttribute('aria-label')?.includes('大模型'))
check('all four project cards rendered', () => doc.querySelectorAll('.cards .card').length === 4)
check('NURBS hero fallback rendered', () => doc.querySelectorAll('.cad-visual .cad-fallback .cad-f-pt').length === 49)
check('background canvas is inert and hidden from AT', () => {
  const canvas = doc.querySelector('.ambient-canvas')
  return !!canvas && canvas.getAttribute('aria-hidden') === 'true'
})
check('canonical points at the custom domain', () => doc.querySelector('link[rel="canonical"]')?.href === 'https://www.dongwangxing.online/')
check('cache demo rows rendered', () => doc.querySelectorAll('.demo .turn').length === 4)
check('cache controls rendered', () => doc.querySelectorAll('.seg-ctl button').length === 2)
check('baseline cache measurements match the source', () => {
  const values = [...doc.querySelectorAll('.demo-stat .v')].map((node) => node.textContent)
  return values[0] === '55.51%' && values[1] === '4 次'
})
check('experiment scope and cost baseline are explicit', () => {
  const note = doc.querySelector('.numbers-note')?.textContent || ''
  return note.includes('各配置仅 1 个运行样本') && note.includes('$1.80 → $1.42') && note.includes('并非相对最初版本降本')
})
check('engineering work is described without obsolete measurements', () => text.includes('prompt_cache_key') && text.includes('15–25k') && !/50–60%|74 次|20%/.test(text))
check('all four experience rows rendered', () => doc.querySelectorAll('.timeline > li').length === 4)
check('all four skill groups rendered', () => doc.querySelectorAll('.skills .sk').length === 4)
check('external links are present', () => doc.querySelectorAll('a[href^="http"]').length >= 3)
check('mailto link is present', () => !!doc.querySelector('a[href^="mailto:"]'))
check('legacy sections are present', () => ['work', 'experience', 'skills', 'contact'].every((id) => doc.querySelector(`#${id}`)))
check('no template placeholder leaked', () => !/undefined|NaN|\[object/.test(text))
check('page is not empty', () => text.trim().length > 1200)
check('cache mode switch does not throw', () => {
  doc.querySelector('[data-mode="after"]')?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  return true
})
await new Promise((resolveRender) => setTimeout(resolveRender, 100))
check('latest measurements render after switching', () => {
  const values = [...doc.querySelectorAll('.demo-stat .v')].map((node) => node.textContent)
  return values[0] === '73.0%' && values[1] === '2 次' && doc.querySelector('.demo-note')?.textContent.includes('480k / 24')
})
check('still healthy after interaction', () => errors.length === 0 && !!doc.querySelector('.demo'))

console.log(`RUNTIME SMOKE TEST — ${errors.length} problems, ${passed.length} checks passed\n`)
for (const item of passed) console.log(`  ✓ ${item}`)
for (const error of errors) console.log(`  ✗ ${error}`)
window.close()
process.exitCode = errors.length ? 1 : 0
