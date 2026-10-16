import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  LineSegments,
  NormalBlending,
  PerspectiveCamera,
  Plane,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  Timer,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { onThemeChange, readThemeColors } from '../lib/theme.js'

// Terrain bounds in world units. The camera flies from z = 7 toward -9 as the
// page scrolls; the far edge sits beyond the fog so it never shows.
const X0 = -20
const X1 = 20
const Z0 = -44
const Z1 = 10

// Everything that moves is evaluated on the GPU: the CPU only updates a few
// uniforms per frame, so the backdrop stays cheap even on phones.
const SURFACE = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  uniform float uMouseAmp;

  float surface(vec2 p) {
    float t = uTime;
    float h = 0.55 * sin(p.x * 0.32 + t * 0.35) * cos(p.y * 0.27 - t * 0.28);
    h += 0.28 * sin((p.x + p.y) * 0.55 + t * 0.6);
    h += 0.12 * sin(p.x * 1.3 - p.y * 0.9 + t * 1.1);
    h *= 0.75 + 0.6 * uScroll;
    float d = distance(p, uMouse);
    h += uMouseAmp * 0.55 * exp(-d * d * 0.12) * sin(d * 2.4 - t * 4.0);
    return h;
  }
`

const FADE = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uOpacity;

  // Distance fog plus a fade toward the top of the screen, so the horizon
  // dissolves and headline copy above it stays legible.
  float fade(float depth) {
    float fog = (1.0 - smoothstep(8.0, 30.0, depth)) * smoothstep(0.6, 2.5, depth);
    float top = 1.0 - smoothstep(0.6, 1.0, gl_FragCoord.y / uResolution.y);
    return fog * top * uOpacity;
  }
`

const lineShader = {
  vertexShader: /* glsl */ `
    ${SURFACE}
    uniform float uScan;
    varying float vHeight;
    varying float vDepth;
    varying float vScan;

    void main() {
      vec3 p = position;
      p.y = surface(p.xz);
      vHeight = p.y;
      float s = (p.z - uScan) * 1.6;
      vScan = exp(-s * s);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vDepth = -mv.z;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    ${FADE}
    uniform vec3 uInk;
    uniform vec3 uAccent;
    varying float vHeight;
    varying float vDepth;
    varying float vScan;

    void main() {
      float peak = smoothstep(0.3, 0.85, vHeight);
      float glow = max(peak, vScan);
      vec3 color = mix(uInk, uAccent, glow);
      float alpha = (0.16 + 0.5 * peak + 0.55 * vScan) * fade(vDepth);
      gl_FragColor = vec4(color, alpha);
    }
  `,
}

const pointShader = {
  vertexShader: /* glsl */ `
    ${SURFACE}
    attribute vec3 aSeed;
    uniform float uPixelRatio;
    varying float vHit;
    varying float vDepth;

    void main() {
      // Tokens stream along +x over the surface and wrap around.
      float span = ${(X1 - X0).toFixed(1)};
      float x = mod(aSeed.x * span + uTime * (0.5 + aSeed.y * 0.9), span) + ${X0.toFixed(1)};
      float z = aSeed.z;
      vec3 p = vec3(x, surface(vec2(x, z)) + 0.12 + aSeed.y * 0.35, z);
      vHit = step(0.72, aSeed.y);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vDepth = -mv.z;
      gl_PointSize = clamp((vHit > 0.5 ? 11.0 : 7.0) * uPixelRatio / vDepth * 4.0, 1.0, 14.0 * uPixelRatio);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    ${FADE}
    uniform vec3 uInk;
    uniform vec3 uAccent;
    varying float vHit;
    varying float vDepth;

    void main() {
      float r = length(gl_PointCoord - 0.5);
      if (r > 0.5) discard;
      float soft = 1.0 - smoothstep(0.0, 0.5, r);
      vec3 color = vHit > 0.5 ? uAccent : uInk;
      gl_FragColor = vec4(color, soft * (vHit > 0.5 ? 0.95 : 0.4) * fade(vDepth));
    }
  `,
}

function luminance(hex) {
  const value = new Color(hex)
  return 0.2126 * value.r + 0.7152 * value.g + 0.0722 * value.b
}

// Two families of iso-lines (constant z, then constant x) as one LineSegments.
function terrainGeometry(lines, segments) {
  const positions = new Float32Array(lines * 2 * (segments + 1) * 3)
  const index = []
  let vertex = 0
  const push = (x, z) => {
    positions.set([x, 0, z], vertex * 3)
    vertex += 1
  }
  for (let family = 0; family < 2; family += 1) {
    for (let line = 0; line < lines; line += 1) {
      const a = line / (lines - 1)
      for (let s = 0; s <= segments; s += 1) {
        const b = s / segments
        if (family === 0) push(X0 + (X1 - X0) * b, Z0 + (Z1 - Z0) * a)
        else push(X0 + (X1 - X0) * a, Z0 + (Z1 - Z0) * b)
        if (s) index.push(vertex - 2, vertex - 1)
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setIndex(index)
  return geometry
}

function tokenGeometry(count) {
  const seeds = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    seeds[i * 3] = Math.random()
    seeds[i * 3 + 1] = Math.random()
    seeds[i * 3 + 2] = Z0 + 6 + Math.random() * (Z1 - Z0 - 8)
  }
  const geometry = new BufferGeometry()
  // Positions are computed in the shader; three.js still needs the attribute for the draw count.
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 3))
  return geometry
}

export function mountBackground({ canvas, reduce, onReady }) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' })
  const compact = window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 760
  const pixelRatio = Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.5)
  renderer.setPixelRatio(pixelRatio)
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(48, 1, 0.1, 60)

  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uMouse: { value: new Vector2(999, 999) },
    uMouseAmp: { value: 0 },
    uScan: { value: Z0 },
    uInk: { value: new Color() },
    uAccent: { value: new Color() },
    uOpacity: { value: 1 },
    uResolution: { value: new Vector2(1, 1) },
    uPixelRatio: { value: pixelRatio },
  }
  const shared = { uniforms, transparent: true, depthWrite: false }
  const lineMaterial = new ShaderMaterial({ ...lineShader, ...shared })
  const pointMaterial = new ShaderMaterial({ ...pointShader, ...shared })

  const terrain = new LineSegments(terrainGeometry(compact ? 44 : 76, compact ? 96 : 170), lineMaterial)
  const tokens = new Points(tokenGeometry(compact ? 260 : 620), pointMaterial)
  // Vertices move in the shader, so CPU-side bounds are meaningless.
  terrain.frustumCulled = false
  tokens.frustumCulled = false
  scene.add(terrain, tokens)

  const applyColors = ({ ink, accent, bg }) => {
    const dark = luminance(bg) < 0.4
    // Raw shaders skip three's output colour conversion, so hand them the CSS (sRGB) values as-is.
    uniforms.uInk.value.set(ink).convertLinearToSRGB()
    uniforms.uAccent.value.set(accent).convertLinearToSRGB()
    uniforms.uOpacity.value = dark ? 0.85 : 0.7
    // Glow reads well on dark backgrounds; on paper-white it would wash out.
    for (const material of [lineMaterial, pointMaterial]) {
      material.blending = dark ? AdditiveBlending : NormalBlending
      material.needsUpdate = true
    }
  }
  applyColors(readThemeColors())

  const timer = new Timer()
  timer.connect(document)
  const raycaster = new Raycaster()
  const ground = new Plane(new Vector3(0, 1, 0), 0)
  const hit = new Vector3()
  const pointer = { x: 0, y: 0, active: false }
  const eased = { x: 0, y: 0, scroll: 0, amp: 0 }
  const look = new Vector3()
  let frame = 0

  const scrollProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    return max > 0 ? Math.min(window.scrollY / max, 1) : 0
  }

  const placeCamera = () => {
    const z = 7 - eased.scroll * 16
    camera.position.set(eased.x * 0.9, 2.6 + Math.sin(eased.scroll * Math.PI) * 0.9 - eased.y * 0.25, z)
    look.set(eased.x * 0.4, -0.2, z - 9)
    camera.lookAt(look)
  }

  const step = (time, delta) => {
    const ease = 1 - Math.exp(-delta * 3)
    eased.x += (pointer.x - eased.x) * ease
    eased.y += (pointer.y - eased.y) * ease
    eased.scroll += (scrollProgress() - eased.scroll) * ease
    eased.amp += ((pointer.active ? 1 : 0) - eased.amp) * ease
    placeCamera()

    if (pointer.active) {
      raycaster.setFromCamera({ x: pointer.x, y: -pointer.y }, camera)
      if (raycaster.ray.intersectPlane(ground, hit)) uniforms.uMouse.value.set(hit.x, hit.z)
    }
    uniforms.uTime.value = time
    uniforms.uScroll.value = eased.scroll
    uniforms.uMouseAmp.value = eased.amp
    uniforms.uScan.value = ((time * 3.2) % (Z1 - Z0)) + Z0
  }

  let ready = false
  const render = () => {
    renderer.render(scene, camera)
    if (!ready) {
      ready = true
      onReady?.()
    }
  }

  const tick = (timestamp) => {
    timer.update(timestamp)
    step(timer.getElapsed(), Math.min(timer.getDelta(), 0.1))
    render()
    frame = requestAnimationFrame(tick)
  }

  // Reduced motion: one still frame of the terrain, no flight, no ripples.
  const still = () => {
    uniforms.uTime.value = 8
    uniforms.uScan.value = Z0
    placeCamera()
    render()
  }

  const resize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    renderer.setSize(width, height, false)
    uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
    if (reduce) still()
  }

  const onPointerMove = (event) => {
    pointer.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1
    pointer.y = (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1
    pointer.active = true
  }
  const onPointerLeave = () => {
    pointer.active = false
  }
  const stopTheme = onThemeChange((colors) => {
    applyColors(colors)
    if (reduce) still()
  })

  resize()
  window.addEventListener('resize', resize, { passive: true })
  if (reduce) still()
  else {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('blur', onPointerLeave)
    frame = requestAnimationFrame(tick)
  }

  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', onPointerMove)
    document.documentElement.removeEventListener('pointerleave', onPointerLeave)
    window.removeEventListener('blur', onPointerLeave)
    stopTheme()
    timer.dispose()
    terrain.geometry.dispose()
    tokens.geometry.dispose()
    lineMaterial.dispose()
    pointMaterial.dispose()
    renderer.dispose()
  }
}
