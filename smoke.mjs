/**
 * Runtime smoke test.
 *
 * The sandbox on this machine cannot launch Chrome or Edge (both crash on
 * launch), so scripts/shoot.mjs and scripts/audit.js cannot run here. This
 * test mounts the built bundle in jsdom instead — it cannot judge layout or
 * composition, but it does prove the app renders, the content is present,
 * the interaction wiring is intact, and nothing throws at runtime.
 */
import { JSDOM, VirtualConsole } from 'jsdom'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const errors = []
const passed = []
const vc = new VirtualConsole()
vc.on('jsdomError', (e) => errors.push(`jsdomError: ${e.message}`))
vc.on('error', (...a) => errors.push(`console.error: ${a.join(' ')}`))

const html = readFileSync('dist/index.html', 'utf8')
const dom = new JSDOM(html, {
  url: `file://${resolve('dist/index.html').replace(/\\/g, '/')}`,
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
})

const { window } = dom
const check = (name, fn) => {
  try {
    const r = fn()
    if (r === false) errors.push(`FAIL ${name}`)
    else passed.push(name)
  } catch (e) {
    errors.push(`THREW ${name}: ${e.message}`)
  }
}

await new Promise((r) => {
  if (window.document.readyState === 'complete') r()
  else window.addEventListener('load', r, { once: true })
})
// let the deferred bundle execute + React commit
await new Promise((r) => setTimeout(r, 400))

const doc = window.document
const text = doc.body.textContent || ''

check('bundle executed (no runtime error)', () => errors.length === 0)
check('<h1> renders the name', () => doc.querySelector('h1')?.textContent.includes('戴玮轩'))
check('context window panel exists', () => !!doc.querySelector('.window'))
check('transcript has 4 lines', () => doc.querySelectorAll('.line').length === 4)
check('all 5 project cards render', () => doc.querySelectorAll('.card').length === 5)
check('cache demo rows render', () => doc.querySelectorAll('.ctx__row').length === 9)
check('cache stats render', () => doc.querySelectorAll('.stat').length === 2)
check('replay button is reachable', () => !!doc.querySelector('.cache__replay'))
check('all 3 jobs + education render', () => doc.querySelectorAll('.job').length === 4)
check('skill groups render', () => doc.querySelectorAll('.skill__group').length === 4)
check('external links are present', () => doc.querySelectorAll('a[href^="http"]').length >= 3)
check('mailto link present', () => !!doc.querySelector('a[href^="mailto:"]'))
check('measured numbers appear', () => text.includes('58') && text.includes('74') && text.includes('20'))
check('no template placeholder leaked', () => !/undefined|NaN|\[object/.test(text))
check('page is not empty', () => text.trim().length > 1200)

// simulate the replay interaction (React state update + re-render)
check('replay click does not throw', () => {
  doc.querySelector('.cache__replay')?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  return true
})
await new Promise((r) => setTimeout(r, 200))
check('still healthy after interaction', () => errors.length === 0 && !!doc.querySelector('.card'))

console.log(`RUNTIME SMOKE TEST — ${errors.length} problems, ${passed.length} checks passed\n`)
for (const p of passed) console.log(`  ✓ ${p}`)
for (const e of errors) console.log(`  ✗ ${e}`)

window.close()
process.exitCode = errors.length ? 1 : 0
