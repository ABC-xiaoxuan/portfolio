/**
 * Static audit — the subset of the review checklist that can be verified
 * from source, without a browser.
 *
 * Used because this machine cannot run Chrome/Edge at all (both crash on
 * launch inside the sandbox), so scripts/audit.js cannot execute.
 */
import { readFileSync } from 'node:fs'

const css = readFileSync('styles.css', 'utf8')
const jsxFiles = [
  'src/App.jsx',
  'src/hooks/useReveal.js',
  'src/components/Hero.jsx',
  'src/components/Projects.jsx',
  'src/components/CacheDemo.jsx',
  'src/components/Experience.jsx',
  'src/components/Skills.jsx',
  'src/components/Footer.jsx',
]
const jsx = jsxFiles.map((f) => readFileSync(f, 'utf8')).join('\n')

const issues = []
const ok = []
const push = (severity, check, detail) => issues.push({ severity, check, detail })

/* ---------- helpers ---------- */
const srgb = (c) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}
const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(srgb)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`))
  return m ? m[1] : null
}

/* ---------- 4. Colour: contrast ---------- */
const bg = token('bg')
const bg1 = token('bg-1')
const bg2 = token('bg-2')
const pairs = [
  ['text on bg', token('text'), bg, 4.5],
  ['text on bg-1 (cards)', token('text'), bg1, 4.5],
  ['text-2 on bg', token('text-2'), bg, 4.5],
  ['text-2 on bg-1 (cards)', token('text-2'), bg1, 4.5],
  ['text-3 on bg (meta)', token('text-3'), bg, 4.5],
  ['text-3 on bg-2 (window bar)', token('text-3'), bg2, 4.5],
  ['accent on bg', token('accent'), bg, 4.5],
  ['accent on bg-1', token('accent'), bg1, 4.5],
  ['warn on bg', token('warn'), bg, 4.5],
]

for (const [label, fg, bgc, min] of pairs) {
  if (!fg || !bgc) {
    push('error', 'contrast', `missing token for "${label}"`)
    continue
  }
  const ratio = contrast(fg, bgc)
  if (ratio < min) {
    push('error', 'contrast', `${label}: ${ratio.toFixed(2)}:1 < ${min}:1`)
  } else if (ratio < min + 1.2) {
    push('warning', 'contrast', `${label}: ${ratio.toFixed(2)}:1 — thin margin`)
  } else {
    ok.push(`contrast ${label}: ${ratio.toFixed(2)}:1`)
  }
}

/* ---------- 1. Typography: CJK font fallback ---------- */
const CJK = /PingFang SC|Microsoft YaHei|Noto Sans SC|HarmonyOS Sans SC|Source Han Sans|Hiragino Sans GB|SimHei/i
const fontDecls = [...css.matchAll(/--font-[a-z]+:\s*([^;]+);/g)]
if (fontDecls.length === 0) push('error', 'font-stack', 'no font stacks found')
for (const [, stack] of fontDecls) {
  if (!CJK.test(stack)) {
    push('error', 'cjk-fallback', `font stack lacks an explicit CJK family: ${stack.slice(0, 70)}…`)
  }
}
if (fontDecls.every(([, s]) => CJK.test(s))) ok.push(`all ${fontDecls.length} font stacks declare a CJK family`)

/* ---------- 5. Motion: reduced-motion rule ---------- */
if (/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css)) {
  ok.push('prefers-reduced-motion block present')
} else {
  push('error', 'reduced-motion', 'no @media (prefers-reduced-motion: reduce) block')
}
if (/prefers-reduced-motion/.test(jsx)) {
  ok.push('JS also short-circuits animation under reduced motion')
} else {
  push('warning', 'reduced-motion', 'JS animations do not check prefers-reduced-motion')
}

/* ---------- 2. Whitespace: shorthand padding trap ---------- */
const shorthand = [...css.matchAll(/^\s*\.([a-z0-9_-]+)([^{]*)\{([^}]*)\}/gim)].filter(
  (m) => /\.(section|hero|footer|wrap)/.test(m[1]) && /(^|[;\s])padding:\s/.test(m[3]),
)
if (shorthand.length) {
  push('error', 'shorthand-padding', `container/block rule uses padding shorthand: .${shorthand[0][1]}`)
} else {
  ok.push('no padding shorthand on layout containers (uses padding-block / padding-inline)')
}
if (/padding-inline/.test(css) && /padding-block/.test(css)) ok.push('padding-block / padding-inline used consistently')

/* ---------- 5b. Motion: transform / opacity only ---------- */
const widthAnim = [...css.matchAll(/transition:\s*([^;]*)/g)].map((m) => m[1]).filter((v) => /\bwidth\b/.test(v))
if (widthAnim.length) {
  push('error', 'motion', `${widthAnim.length} transition(s) animate width → layout thrash`)
} else {
  ok.push('no width transitions (bars animate with scaleX)')
}
if (/transform:\s*scaleX\(/.test(css)) ok.push('scaleX used for progress bars')

/* ---------- 6. Micro-interactions: 44px targets ---------- */
const clickable = ['.hero__meta a', '.card__link', '.footer__links a', '.cache__replay']
for (const sel of clickable) {
  const re = new RegExp(`\\${sel}\\s*\\{([^}]*)\\}`, 'i')
  const m = css.match(re)
  const body = m ? m[1] : ''
  if (/min-height:\s*44px/.test(body)) ok.push(`${sel} has 44px min target`)
  else push('warning', 'tap-target', `${sel} has no min-height: 44px`)
}

/* ---------- 6b. focus-visible ---------- */
if (/:focus-visible/.test(css)) ok.push(':focus-visible styling present')
else push('error', 'focus', 'no :focus-visible rule')

/* ---------- 7. Responsive: overflow guards ---------- */
if (/overflow-x:\s*clip/.test(css)) ok.push('body uses overflow-x: clip')
else push('warning', 'overflow', 'no overflow-x guard on body')

const fixedWidths = [...css.matchAll(/[^-]width:\s*(\d{3,})px/g)].map((m) => Number(m[1])).filter((w) => w > 375)
if (fixedWidths.length) push('warning', 'overflow', `fixed widths > 375px found: ${fixedWidths.join(', ')}`)

/* ---------- 3. Hierarchy / 8. originality: structural checks ---------- */
const h1Count = (jsx.match(/<h1/g) || []).length
if (h1Count === 1) ok.push('exactly one <h1>')
else push('error', 'hierarchy', `${h1Count} <h1> elements`)

const headingOrder = [...jsx.matchAll(/<h([1-3])/g)].map((m) => Number(m[1]))
let orderOk = true
for (let i = 1; i < headingOrder.length; i++) {
  if (headingOrder[i] - headingOrder[i - 1] > 1) orderOk = false
}
if (orderOk) ok.push('heading levels never skip')
else push('warning', 'hierarchy', `heading order jumps: ${headingOrder.join(' → ')}`)

/* ---------- 1b. text-wrap balance for CJK headings ---------- */
if (/text-wrap:\s*balance/.test(css)) ok.push('text-wrap: balance used on headings')
else push('warning', 'typography', 'no text-wrap: balance for headings')

if (/white-space:\s*nowrap/.test(css)) ok.push('nowrap used to protect CJK phrases')

/* ---------- report ---------- */
const errors = issues.filter((i) => i.severity === 'error')
const warnings = issues.filter((i) => i.severity === 'warning')

console.log(`STATIC AUDIT — ${errors.length} errors, ${warnings.length} warnings\n`)
for (const i of issues) console.log(`  ${i.severity === 'error' ? '✗' : '!'} ${i.check.padEnd(18)} ${i.detail}`)
if (!issues.length) console.log('  (nothing found)')
console.log(`\nPASSED CHECKS (${ok.length}):`)
for (const o of ok) console.log(`  ✓ ${o}`)

process.exitCode = errors.length ? 1 : 0
