import { useEffect, useMemo, useRef, useState } from 'react'
import useReducedMotion from '../hooks/useReducedMotion.js'
import { COUNT, DEGREE, isoCurves, range, restControls, sampleBasis } from '../lib/nurbs.js'

const LINES = 11
const STEPS = 40
const VIEW = { width: 600, height: 400 }

// Static projection of the rest surface, matching the WebGL camera closely enough
// to cross-fade. It is the placeholder while three.js loads and the fallback when
// WebGL is unavailable.
function projectFallback() {
  const { controls, weights } = restControls()
  const iso = isoCurves(controls, weights, sampleBasis(range(LINES)), sampleBasis(range(STEPS)), new Float32Array(LINES * 2 * STEPS * 3))
  const eye = [0, 2.5, 4.6]
  const length = Math.hypot(...eye)
  const forward = eye.map((value) => -value / length)
  const right = [forward[2], 0, -forward[0]].map((value, _, all) => value / Math.hypot(...all))
  const up = [right[1] * forward[2] - right[2] * forward[1], right[2] * forward[0] - right[0] * forward[2], right[0] * forward[1] - right[1] * forward[0]]
  const tan = Math.tan((32 / 2) * Math.PI / 180)
  const aspect = VIEW.width / VIEW.height
  const cos = Math.cos(-0.55)
  const sin = Math.sin(-0.55)
  const project = (x, y, z) => {
    const p = [x * cos + z * sin - eye[0], y - eye[1], -x * sin + z * cos - eye[2]]
    const depth = p[0] * forward[0] + p[1] * forward[1] + p[2] * forward[2]
    const sx = (p[0] * right[0] + p[1] * right[1] + p[2] * right[2]) / (depth * tan * aspect)
    const sy = (p[0] * up[0] + p[1] * up[1] + p[2] * up[2]) / (depth * tan)
    return [((sx + 1) / 2 * VIEW.width).toFixed(1), ((1 - sy) / 2 * VIEW.height).toFixed(1)]
  }
  const polyline = (points) => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join('')
  const curves = Array.from({ length: LINES * 2 }, (_, line) => polyline(Array.from({ length: STEPS }, (_, s) => {
    const offset = (line * STEPS + s) * 3
    return project(iso[offset], iso[offset + 1], iso[offset + 2])
  })))
  const edges = new Set([0, LINES - 1, LINES, LINES * 2 - 1])
  const node = (i, j) => project(controls[(i * COUNT + j) * 3], controls[(i * COUNT + j) * 3 + 1], controls[(i * COUNT + j) * 3 + 2])
  const net = []
  for (let i = 0; i < COUNT; i += 1) {
    net.push(polyline(Array.from({ length: COUNT }, (_, j) => node(i, j))), polyline(Array.from({ length: COUNT }, (_, j) => node(j, i))))
  }
  return {
    inner: curves.filter((_, line) => !edges.has(line)).join(''),
    edge: curves.filter((_, line) => edges.has(line)).join(''),
    net: net.join(''),
    points: Array.from({ length: COUNT * COUNT }, (_, index) => node(Math.floor(index / COUNT), index % COUNT)),
  }
}

export default function NurbsScene() {
  const hostRef = useRef(null)
  const canvasRef = useRef(null)
  const reduce = useReducedMotion()
  const [live, setLive] = useState(false)
  const [active, setActive] = useState(null)
  const fallback = useMemo(projectFallback, [])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas || !window.WebGLRenderingContext) return undefined
    let cancelled = false
    let dispose
    // Keep the namespace whole: destructuring in the parameter let Rollup
    // tree-shake the module away, leaving mountNurbsScene undefined.
    import('../three/nurbsScene.js').then((scene) => {
      if (cancelled) return
      try {
        dispose = scene.mountNurbsScene({ host, canvas, reduce, onReady: () => setLive(true), onActive: setActive })
      } catch {
        // No usable WebGL context: the static SVG stays in place.
      }
    }).catch(() => {})
    return () => {
      cancelled = true
      dispose?.()
    }
  }, [reduce])

  return <div ref={hostRef} className={`cad-visual${live ? ' is-live' : ''}`} role="img" aria-label={`可交互的 NURBS 曲面：${DEGREE} 次，${COUNT}×${COUNT} 控制网格`}>
    <svg className="cad-fallback" viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path className="cad-f-net" d={fallback.net} />
      <path className="cad-f-inner" d={fallback.inner} />
      <path className="cad-f-edge" d={fallback.edge} />
      {fallback.points.map(([x, y], index) => <rect className="cad-f-pt" key={index} x={x - 2.5} y={y - 2.5} width="5" height="5" />)}
    </svg>
    <canvas ref={canvasRef} aria-hidden="true" />
    <div className="cad-visual-head">
      <span>NURBS SURFACE</span>
      <span>{active ? `P${active.i},${active.j} · w ${active.w}` : `deg ${DEGREE}×${DEGREE} · ${COUNT}×${COUNT}`}</span>
    </div>
    <div className="cad-visual-foot">
      <span><i className="cad-dot cad-dot-hit" />控制点</span>
      <span><i className="cad-dash" />等参线</span>
      <span className="cad-hint">{live ? '移动指针，拉起控制点' : '曲面加载中'}</span>
    </div>
  </div>
}
