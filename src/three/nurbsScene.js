import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  Timer,
  Vector3,
  WebGLRenderer,
} from 'three'
import { COUNT, evaluate, isoCurves, range, restControls, sampleBasis } from '../lib/nurbs.js'
import { onThemeChange, readThemeColors } from '../lib/theme.js'

const LINES = 11
const STEPS = 48
const FILL = 24
const LIFT = 0.75
const HEAVY = 2.6
const PICK_RADIUS = 72

// Index pairs that join consecutive samples of each polyline in `lines`.
function polylineIndex(lines, steps) {
  const index = []
  for (const line of lines) {
    for (let s = 0; s < steps - 1; s += 1) index.push(line * steps + s, line * steps + s + 1)
  }
  return index
}

export function mountNurbsScene({ host, canvas, reduce, onReady, onActive }) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(pixelRatio)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = SRGBColorSpace

  const scene = new Scene()
  const camera = new PerspectiveCamera(32, 1, 0.1, 50)
  camera.position.set(0, 2.5, 4.6)
  camera.lookAt(0, -0.05, 0)

  const rest = restControls()
  const controls = rest.controls.slice()
  const weights = rest.weights.slice()
  const lift = new Float32Array(COUNT * COUNT)
  const weightBoost = new Float32Array(COUNT * COUNT)

  // Isoparametric curves: interior lines plus a heavier boundary, sharing one buffer.
  const isoBasis = sampleBasis(range(LINES))
  const stepBasis = sampleBasis(range(STEPS))
  const isoPositions = new BufferAttribute(new Float32Array(LINES * 2 * STEPS * 3), 3)
  const allLines = Array.from({ length: LINES * 2 }, (_, line) => line)
  const edgeLines = [0, LINES - 1, LINES, LINES * 2 - 1]
  const innerGeometry = new BufferGeometry()
  innerGeometry.setAttribute('position', isoPositions)
  innerGeometry.setIndex(polylineIndex(allLines.filter((line) => !edgeLines.includes(line)), STEPS))
  const edgeGeometry = new BufferGeometry()
  edgeGeometry.setAttribute('position', isoPositions)
  edgeGeometry.setIndex(polylineIndex(edgeLines, STEPS))

  // A barely-there fill gives the surface volume without competing with the lines.
  const fillBasis = sampleBasis(range(FILL))
  const fillPositions = new BufferAttribute(new Float32Array(FILL * FILL * 3), 3)
  const fillIndex = []
  for (let i = 0; i < FILL - 1; i += 1) {
    for (let j = 0; j < FILL - 1; j += 1) {
      const a = i * FILL + j
      fillIndex.push(a, a + 1, a + FILL, a + 1, a + FILL + 1, a + FILL)
    }
  }
  const fillGeometry = new BufferGeometry()
  fillGeometry.setAttribute('position', fillPositions)
  fillGeometry.setIndex(fillIndex)

  // Control net and its points read straight from the control array.
  const netPositions = new BufferAttribute(controls, 3)
  const netIndex = []
  for (let i = 0; i < COUNT; i += 1) {
    for (let j = 0; j < COUNT - 1; j += 1) {
      netIndex.push(i * COUNT + j, i * COUNT + j + 1, j * COUNT + i, (j + 1) * COUNT + i)
    }
  }
  const netGeometry = new BufferGeometry()
  netGeometry.setAttribute('position', netPositions)
  netGeometry.setIndex(netIndex)
  const pointGeometry = new BufferGeometry()
  pointGeometry.setAttribute('position', netPositions)
  const activePosition = new BufferAttribute(new Float32Array(3), 3)
  const activeGeometry = new BufferGeometry()
  activeGeometry.setAttribute('position', activePosition)

  const materials = {
    inner: new LineBasicMaterial({ transparent: true, opacity: 0.5 }),
    edge: new LineBasicMaterial({ transparent: true, opacity: 0.95 }),
    fill: new MeshBasicMaterial({ transparent: true, opacity: 0.06, side: DoubleSide, depthWrite: false }),
    net: new LineBasicMaterial({ transparent: true, opacity: 0.2 }),
    points: new PointsMaterial({ size: 5 * pixelRatio, sizeAttenuation: false, transparent: true, opacity: 0.7 }),
    active: new PointsMaterial({ size: 11 * pixelRatio, sizeAttenuation: false, depthTest: false }),
  }
  const applyColors = ({ ink, accent }) => {
    const inkColor = new Color(ink)
    const accentColor = new Color(accent)
    for (const key of ['inner', 'edge', 'fill', 'active']) materials[key].color.copy(accentColor)
    for (const key of ['net', 'points']) materials[key].color.copy(inkColor)
  }
  applyColors(readThemeColors())

  const model = new Group()
  const fill = new Mesh(fillGeometry, materials.fill)
  const inner = new LineSegments(innerGeometry, materials.inner)
  const edge = new LineSegments(edgeGeometry, materials.edge)
  const net = new LineSegments(netGeometry, materials.net)
  const points = new Points(pointGeometry, materials.points)
  const active = new Points(activeGeometry, materials.active)
  active.visible = false
  active.renderOrder = 2
  model.add(fill, inner, edge, net, points, active)
  scene.add(model)

  const timer = new Timer()
  timer.connect(document)
  const pointer = { x: 0, y: 0, inside: false, px: 0, py: 0 }
  const parallax = { x: 0, y: 0 }
  const projected = new Vector3()
  let activeIndex = -1
  let width = 1
  let height = 1
  let frame = 0
  let visible = true
  let ready = false

  const resize = () => {
    width = Math.max(host.clientWidth, 1)
    height = Math.max(host.clientHeight, 1)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // Pull back on tall, narrow frames so the whole patch stays in view.
    camera.position.setLength(5.25 * Math.max(1, 1.45 / camera.aspect))
    camera.lookAt(0, -0.05, 0)
    camera.updateProjectionMatrix()
    wake()
  }

  // Nearest control point to the pointer in screen space, within PICK_RADIUS.
  const pick = () => {
    if (!pointer.inside) return -1
    model.updateMatrixWorld()
    let best = -1
    let bestDistance = PICK_RADIUS * PICK_RADIUS
    for (let index = 0; index < COUNT * COUNT; index += 1) {
      projected.fromArray(controls, index * 3).applyMatrix4(model.matrixWorld).project(camera)
      const dx = (projected.x + 1) / 2 * width - pointer.px
      const dy = (1 - projected.y) / 2 * height - pointer.py
      const distance = dx * dx + dy * dy
      if (distance < bestDistance) {
        bestDistance = distance
        best = index
      }
    }
    return best
  }

  const step = (time, delta) => {
    const ease = reduce ? 1 : 1 - Math.exp(-delta * 7)
    parallax.x += (pointer.x - parallax.x) * ease
    parallax.y += (pointer.y - parallax.y) * ease
    model.rotation.y = -0.55 + (reduce ? 0 : Math.sin(time * 0.12) * 0.3) + parallax.x * 0.16
    model.rotation.x = parallax.y * 0.08

    const next = pick()
    if (next !== activeIndex) {
      activeIndex = next
      onActive?.(next < 0 ? null : { i: Math.floor(next / COUNT), j: next % COUNT, w: +(rest.weights[next] + HEAVY - 1).toFixed(1) })
    }

    let settling = false
    for (let index = 0; index < COUNT * COUNT; index += 1) {
      const target = index === activeIndex ? LIFT : 0
      lift[index] += (target - lift[index]) * ease
      weightBoost[index] += ((index === activeIndex ? HEAVY - 1 : 0) - weightBoost[index]) * ease
      if (Math.abs(target - lift[index]) > 1e-3) settling = true
      const i = Math.floor(index / COUNT)
      const j = index % COUNT
      const wave = reduce ? 0 : Math.sin(time * 0.7 + i * 0.9 + j * 0.6) * 0.09
      controls[index * 3 + 1] = rest.controls[index * 3 + 1] + wave + lift[index]
      weights[index] = rest.weights[index] + weightBoost[index]
    }

    isoCurves(controls, weights, isoBasis, stepBasis, isoPositions.array)
    let offset = 0
    for (const su of fillBasis) {
      for (const sv of fillBasis) {
        evaluate(controls, weights, su, sv, fillPositions.array, offset)
        offset += 3
      }
    }
    isoPositions.needsUpdate = true
    fillPositions.needsUpdate = true
    netPositions.needsUpdate = true
    active.visible = activeIndex >= 0
    if (activeIndex >= 0) {
      activePosition.array.set(controls.subarray(activeIndex * 3, activeIndex * 3 + 3))
      activePosition.needsUpdate = true
    }
    return settling
  }

  const tick = (timestamp) => {
    frame = 0
    timer.update(timestamp)
    const settling = step(timer.getElapsed(), Math.min(timer.getDelta(), 0.1))
    renderer.render(scene, camera)
    if (!ready) {
      ready = true
      onReady?.()
    }
    if (visible && (!reduce || settling)) frame = requestAnimationFrame(tick)
  }

  function wake() {
    if (!frame && visible) frame = requestAnimationFrame(tick)
  }

  const onPointerMove = (event) => {
    const rect = host.getBoundingClientRect()
    pointer.px = event.clientX - rect.left
    pointer.py = event.clientY - rect.top
    pointer.x = (pointer.px / rect.width - 0.5) * 2
    pointer.y = (pointer.py / rect.height - 0.5) * 2
    pointer.inside = true
    wake()
  }
  const onPointerLeave = () => {
    pointer.inside = false
    pointer.x = 0
    pointer.y = 0
    wake()
  }

  // Stop the loop while the hero is scrolled out of view; reset the timer on
  // resume so the surface picks up where it left off instead of jumping ahead.
  const visibility = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (!visible && frame) {
      cancelAnimationFrame(frame)
      frame = 0
    } else if (visible) {
      timer.reset()
      wake()
    }
  })
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
  const stopTheme = onThemeChange((colors) => {
    applyColors(colors)
    wake()
  })

  resize()
  observer?.observe(host)
  visibility?.observe(host)
  host.addEventListener('pointermove', onPointerMove)
  host.addEventListener('pointerdown', onPointerMove)
  host.addEventListener('pointerleave', onPointerLeave)

  return () => {
    if (frame) cancelAnimationFrame(frame)
    observer?.disconnect()
    visibility?.disconnect()
    stopTheme()
    timer.dispose()
    host.removeEventListener('pointermove', onPointerMove)
    host.removeEventListener('pointerdown', onPointerMove)
    host.removeEventListener('pointerleave', onPointerLeave)
    for (const geometry of [innerGeometry, edgeGeometry, fillGeometry, netGeometry, pointGeometry, activeGeometry]) geometry.dispose()
    for (const material of Object.values(materials)) material.dispose()
    renderer.dispose()
  }
}
