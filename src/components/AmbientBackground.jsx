import { useEffect, useRef } from 'react'
import {
  BufferGeometry,
  Clock,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
  WireframeGeometry,
} from 'three'

const INK = 0x111214
const ACCENT = 0xcf4410

function createPoints(count, spread, color, opacity, size) {
  const positions = new Float32Array(count * 3)
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * spread
    positions[index * 3 + 1] = (Math.random() - 0.5) * spread * 0.72
    positions[index * 3 + 2] = (Math.random() - 0.5) * 2.8
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const material = new PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true })
  return new Points(geometry, material)
}

export default function AmbientBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !window.WebGLRenderingContext) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    let renderer
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' })
    } catch {
      return undefined
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = SRGBColorSpace

    const scene = new Scene()
    const camera = new OrthographicCamera(-4, 4, 3, -3, 0.1, 20)
    camera.position.z = 8

    const world = new Mesh(
      new PlaneGeometry(11, 8, 18, 14),
      new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }),
    )
    world.visible = false
    scene.add(world)

    const gridGeometry = new PlaneGeometry(11, 8, 18, 14)
    const grid = new LineSegments(
      new WireframeGeometry(gridGeometry),
      new LineBasicMaterial({ color: INK, transparent: true, opacity: 0.035 }),
    )
    grid.rotation.x = -0.28
    grid.rotation.y = 0.18
    grid.position.set(0.2, -0.7, -1.3)
    scene.add(grid)

    const accentGrid = new LineSegments(
      new WireframeGeometry(new PlaneGeometry(7, 5, 12, 9)),
      new LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.022 }),
    )
    accentGrid.rotation.x = 0.48
    accentGrid.rotation.y = -0.28
    accentGrid.position.set(-2.2, 1.1, -0.8)
    scene.add(accentGrid)

    const orbit = new Mesh(
      new TorusGeometry(2.5, 0.008, 6, 96),
      new MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.075 }),
    )
    orbit.rotation.x = 1.12
    orbit.rotation.y = -0.28
    orbit.position.set(2.8, 1.1, -0.7)
    scene.add(orbit)

    const points = createPoints(54, 10, INK, 0.12, 0.028)
    points.position.z = -0.4
    scene.add(points)
    const hitPoints = createPoints(8, 7, ACCENT, 0.18, 0.044)
    hitPoints.position.set(1.9, 0.6, -0.1)
    scene.add(hitPoints)

    const pointer = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }
    const clock = new Clock()
    let frame

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const aspect = width / Math.max(height, 1)
      const span = Math.max(4.5, aspect * 3.2)
      camera.left = -span
      camera.right = span
      camera.top = 3.2
      camera.bottom = -3.2
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const render = () => {
      const time = clock.getElapsedTime()
      if (!reduce) {
        target.x += (pointer.x - target.x) * 0.025
        target.y += (pointer.y - target.y) * 0.025
        grid.rotation.z = Math.sin(time * 0.08) * 0.035 + target.x * 0.025
        grid.position.y = -0.7 + Math.sin(time * 0.12) * 0.08 + target.y * 0.08
        accentGrid.rotation.z = -Math.sin(time * 0.1) * 0.05
        orbit.rotation.z = time * 0.04 + target.x * 0.08
        points.rotation.z = time * 0.018
        hitPoints.rotation.z = -time * 0.035
        hitPoints.position.y = 0.6 + Math.sin(time * 0.65) * 0.12
      }
      renderer.render(scene, camera)
      if (!reduce) frame = requestAnimationFrame(render)
    }

    const onPointerMove = (event) => {
      pointer.x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2
      pointer.y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2
    }
    const onScroll = () => {
      const progress = Math.min(window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1), 1)
      target.y = progress * 0.6 - 0.3
    }

    resize()
    render()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', onScroll)
      gridGeometry.dispose()
      grid.geometry.dispose()
      grid.material.dispose()
      accentGrid.geometry.dispose()
      accentGrid.material.dispose()
      orbit.geometry.dispose()
      orbit.material.dispose()
      points.geometry.dispose()
      points.material.dispose()
      hitPoints.geometry.dispose()
      hitPoints.material.dispose()
      world.geometry.dispose()
      world.material.dispose()
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="ambient-canvas" aria-hidden="true" />
}
