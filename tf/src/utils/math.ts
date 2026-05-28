/** Smooth interpolation — Apple-style restrained easing */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

/** Map progress through a sub-range and clamp */
export function rangeProgress(
  progress: number,
  start: number,
  end: number,
): number {
  if (end <= start) return progress >= end ? 1 : 0
  return clamp((progress - start) / (end - start))
}

/** Smoothstep for cinematic fades */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** Exponential dampening for frame-based lerp */
export function damp(
  current: number,
  target: number,
  smoothing: number,
  delta: number,
): number {
  return lerp(current, target, 1 - Math.exp(-smoothing * delta))
}

/** Cubic ease-out — restrained, premium */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Quint ease-in-out — slow, luxurious */
export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
}

export function vec3Lerp(
  out: { x: number; y: number; z: number },
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  t: number,
): void {
  out.x = lerp(a.x, b.x, t)
  out.y = lerp(a.y, b.y, t)
  out.z = lerp(a.z, b.z, t)
}
