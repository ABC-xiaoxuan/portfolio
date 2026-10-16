// Canvas scenes can't use CSS variables directly, so they read the resolved
// design tokens and re-read them whenever the colour scheme flips.

const FALLBACK = { ink: '#111214', accent: '#CF4410', line: '#E6E4DE', bg: '#FAFAF7' }

export function readThemeColors() {
  if (typeof window === 'undefined' || !window.getComputedStyle) return FALLBACK
  const style = window.getComputedStyle(document.documentElement)
  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback
  return {
    ink: read('--ink', FALLBACK.ink),
    accent: read('--accent', FALLBACK.accent),
    line: read('--line', FALLBACK.line),
    bg: read('--bg', FALLBACK.bg),
  }
}

export function onThemeChange(callback) {
  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (!media?.addEventListener) return () => {}
  const handler = () => callback(readThemeColors())
  media.addEventListener('change', handler)
  return () => media.removeEventListener('change', handler)
}
