// Rational B-spline (NURBS) surface evaluation, after The NURBS Book (Piegl & Tiller),
// algorithms A2.1 (FindSpan) and A2.2 (BasisFuns). Pure math, no three.js, so the
// SVG fallback and the WebGL scene share one implementation.

export const DEGREE = 3
export const COUNT = 7

// Clamped uniform knot vector: degree+1 zeros, evenly spaced interior knots, degree+1 ones.
export function clampedKnots(count, degree) {
  const interior = count - degree - 1
  const knots = []
  for (let i = 0; i <= degree; i += 1) knots.push(0)
  for (let i = 1; i <= interior; i += 1) knots.push(i / (interior + 1))
  for (let i = 0; i <= degree; i += 1) knots.push(1)
  return knots
}

export function findSpan(count, degree, u, knots) {
  const n = count - 1
  if (u >= knots[n + 1]) return n
  if (u <= knots[degree]) return degree
  let low = degree
  let high = n + 1
  let mid = (low + high) >> 1
  while (u < knots[mid] || u >= knots[mid + 1]) {
    if (u < knots[mid]) high = mid
    else low = mid
    mid = (low + high) >> 1
  }
  return mid
}

export function basisFunctions(span, u, degree, knots) {
  const basis = [1]
  const left = []
  const right = []
  for (let j = 1; j <= degree; j += 1) {
    left[j] = u - knots[span + 1 - j]
    right[j] = knots[span + j] - u
    let saved = 0
    for (let r = 0; r < j; r += 1) {
      const temp = basis[r] / (right[r + 1] + left[j - r])
      basis[r] = saved + right[r + 1] * temp
      saved = left[j - r] * temp
    }
    basis[j] = saved
  }
  return basis
}

// The knot vector never changes, so basis values for a fixed set of parameters are
// computed once; each frame then only re-weights the control points.
export function sampleBasis(params, count = COUNT, degree = DEGREE) {
  const knots = clampedKnots(count, degree)
  return params.map((u) => {
    const span = findSpan(count, degree, u, knots)
    return { first: span - degree, basis: basisFunctions(span, u, degree, knots) }
  })
}

export function range(steps) {
  return Array.from({ length: steps }, (_, index) => index / (steps - 1))
}

// controls: Float32Array of COUNT*COUNT xyz triples (row-major, u = row); weights: COUNT*COUNT.
export function evaluate(controls, weights, su, sv, out, offset = 0, count = COUNT) {
  let x = 0
  let y = 0
  let z = 0
  let w = 0
  for (let k = 0; k < su.basis.length; k += 1) {
    const row = (su.first + k) * count
    for (let l = 0; l < sv.basis.length; l += 1) {
      const index = row + sv.first + l
      const b = su.basis[k] * sv.basis[l] * weights[index]
      x += b * controls[index * 3]
      y += b * controls[index * 3 + 1]
      z += b * controls[index * 3 + 2]
      w += b
    }
  }
  out[offset] = x / w
  out[offset + 1] = y / w
  out[offset + 2] = z / w
}

// Isoparametric curves: `lines` constant-u curves followed by `lines` constant-v curves,
// each sampled at `steps` points. Writes xyz into `out` (length lines*2*steps*3).
export function isoCurves(controls, weights, isoBasis, stepBasis, out) {
  let offset = 0
  for (const su of isoBasis) {
    for (const sv of stepBasis) {
      evaluate(controls, weights, su, sv, out, offset)
      offset += 3
    }
  }
  for (const sv of isoBasis) {
    for (const su of stepBasis) {
      evaluate(controls, weights, su, sv, out, offset)
      offset += 3
    }
  }
  return out
}

// Rest shape of the control net: a gentle saddle with one raised shoulder, so the
// surface reads as a designed part rather than a flat sheet.
export const SPAN = 1.5
export function restControls(count = COUNT) {
  const controls = new Float32Array(count * count * 3)
  const weights = new Float32Array(count * count).fill(1)
  for (let i = 0; i < count; i += 1) {
    for (let j = 0; j < count; j += 1) {
      const index = i * count + j
      const u = i / (count - 1) * 2 - 1
      const v = j / (count - 1) * 2 - 1
      controls[index * 3] = u * SPAN
      controls[index * 3 + 1] = 0.32 * (u * u - v * v) + 0.38 * Math.exp(-((u - 0.35) ** 2 + (v + 0.3) ** 2) * 3)
      controls[index * 3 + 2] = v * SPAN
    }
  }
  // A heavier interior point pulls the surface toward it: the "rational" in NURBS.
  weights[2 * count + 4] = 2.2
  return { controls, weights }
}
