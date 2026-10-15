import { useEffect, useRef } from 'react'
import {
  BoxGeometry,
  Clock,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TorusKnotGeometry,
  WebGLRenderer,
  WireframeGeometry,
} from 'three'

const ACCENT = 0xcf4410
const INK = 0x111214

export default function CadScene() {
  const hostRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas || !window.WebGLRenderingContext) return undefined

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    let renderer
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
    } catch {
      return undefined
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = SRGBColorSpace

    const scene = new Scene()
    const camera = new PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 0.15, 4.2)

    const model = new Group()
    scene.add(model)

    const knotGeometry = new TorusKnotGeometry(1.05, 0.22, 180, 28, 2, 3)
    const knot = new LineSegments(
      new WireframeGeometry(knotGeometry),
      new LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.72 }),
    )
    model.add(knot)

    const innerGeometry = new TorusKnotGeometry(0.78, 0.012, 120, 12, 2, 3)
    const inner = new Mesh(
      innerGeometry,
      new MeshBasicMaterial({ color: INK, wireframe: true, transparent: true, opacity: 0.28 }),
    )
    model.add(inner)

    const rings = [
      [1.55, 0.018, 0.18, 0.1],
      [1.82, 0.012, 0.08, -0.55],
    ].map(([radius, tube, opacity, tilt]) => {
      const ring = new Mesh(
        new TorusGeometry(radius, tube, 8, 96),
        new MeshBasicMaterial({ color: INK, transparent: true, opacity }),
      )
      ring.rotation.x = Math.PI / 2 + tilt
      model.add(ring)
      return ring
    })

    const tokenGeometry = new BoxGeometry(0.11, 0.11, 0.11)
    const hitMaterial = new MeshBasicMaterial({ color: ACCENT })
    const newMaterial = new MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.7 })
    const tokens = Array.from({ length: 18 }, (_, index) => {
      const token = new Mesh(tokenGeometry, index % 4 === 0 ? hitMaterial : newMaterial)
      token.userData = { angle: (index / 18) * Math.PI * 2, speed: 0.12 + (index % 3) * 0.025, offset: index * 0.37 }
      model.add(token)
      return token
    })

    const core = new Mesh(
      new SphereGeometry(0.07, 16, 16),
      new MeshBasicMaterial({ color: ACCENT }),
    )
    model.add(core)

    const pointer = { x: 0, y: 0 }
    const targetPointer = { x: 0, y: 0 }
    const clock = new Clock()
    let frame

    const resize = () => {
      const width = Math.max(host.clientWidth, 280)
      const height = Math.max(host.clientHeight, 250)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const render = () => {
      const time = clock.getElapsedTime()
      if (!reduce) {
        targetPointer.x += (pointer.x - targetPointer.x) * 0.05
        targetPointer.y += (pointer.y - targetPointer.y) * 0.05
        model.rotation.y = time * 0.12 + targetPointer.x * 0.18
        model.rotation.x = targetPointer.y * 0.12
        knot.rotation.z = time * 0.06
        inner.rotation.z = -time * 0.1
        rings[0].rotation.z = time * 0.12
        rings[1].rotation.z = -time * 0.08
        tokens.forEach((token, index) => {
          const { angle, speed, offset } = token.userData
          const orbit = angle + time * speed
          token.position.set(
            Math.cos(orbit) * (1.35 + (index % 3) * 0.08),
            Math.sin(orbit * 1.7 + offset) * 0.72,
            Math.sin(orbit) * 0.9,
          )
          const pulse = index % 4 === 0 ? 1 + Math.sin(time * 2.4 + offset) * 0.18 : 1
          token.scale.setScalar(pulse)
        })
        core.scale.setScalar(1 + Math.sin(time * 2) * 0.12)
        camera.position.x += (targetPointer.x * 0.22 - camera.position.x) * 0.04
        camera.position.y += (0.15 - targetPointer.y * 0.16 - camera.position.y) * 0.04
      }
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
      if (!reduce) frame = requestAnimationFrame(render)
    }

    const onPointerMove = (event) => {
      const rect = host.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    }
    const onPointerLeave = () => { pointer.x = 0; pointer.y = 0 }

    resize()
    render()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
    observer?.observe(host)
    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerleave', onPointerLeave)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer?.disconnect()
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
      knotGeometry.dispose()
      knot.geometry.dispose()
      knot.material.dispose()
      innerGeometry.dispose()
      inner.geometry.dispose()
      inner.material.dispose()
      rings.forEach((ring) => { ring.geometry.dispose(); ring.material.dispose() })
      tokenGeometry.dispose()
      hitMaterial.dispose()
      newMaterial.dispose()
      core.geometry.dispose()
      core.material.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={hostRef} className="cad-visual" role="img" aria-label="CAD 线框模型与上下文 Token 缓存可视化">
    <canvas ref={canvasRef} aria-hidden="true" />
    <div className="cad-visual-head"><span>CAD / CONTEXT</span><span>LIVE MODEL</span></div>
    <div className="cad-visual-foot"><span><i className="cad-dot cad-dot-hit" />cache hit</span><span><i className="cad-dot cad-dot-new" />new context</span></div>
    <span className="cad-visual-axis cad-axis-x">X</span>
    <span className="cad-visual-axis cad-axis-y">Y</span>
  </div>
}
