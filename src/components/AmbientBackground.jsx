import { useEffect, useRef, useState } from 'react'
import useReducedMotion from '../hooks/useReducedMotion.js'

// Full-page backdrop: a NURBS-style wireframe terrain with streaming tokens.
// three.js is fetched once the browser is idle, so it never delays first paint.
export default function AmbientBackground() {
  const canvasRef = useRef(null)
  const reduce = useReducedMotion()
  const [live, setLive] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !window.WebGLRenderingContext) return undefined
    let cancelled = false
    let dispose
    const load = () => {
      // Keep the namespace whole: destructuring the module in the parameter
      // lets Rollup tree-shake it away (see NurbsScene).
      import('../three/backgroundScene.js').then((scene) => {
        if (cancelled) return
        try {
          dispose = scene.mountBackground({ canvas, reduce, onReady: () => setLive(true) })
        } catch {
          // No usable WebGL context: the plain page background stays.
        }
      }).catch(() => {})
    }
    const idle = window.requestIdleCallback ? window.requestIdleCallback(load, { timeout: 1500 }) : window.setTimeout(load, 600)
    return () => {
      cancelled = true
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
      dispose?.()
    }
  }, [reduce])

  return <canvas ref={canvasRef} className={`ambient-canvas${live ? ' is-live' : ''}`} aria-hidden="true" />
}
