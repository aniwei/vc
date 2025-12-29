import invariant from 'invariant'

import { Offset, Rect, TileMode } from 'bindings'
import { Shader } from 'bindings'

export interface ColorsAndStops {
  colors: number[]
  stops: number[]
}

function clamp01(v: number): number {
  if (v <= 0) return 0
  if (v >= 1) return 1
  return v
}

function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpArgb(a: number, b: number, t: number): number {
  const tt = clamp01(t)
  const aA = (a >>> 24) & 0xff
  const aR = (a >>> 16) & 0xff
  const aG = (a >>> 8) & 0xff
  const aB = a & 0xff

  const bA = (b >>> 24) & 0xff
  const bR = (b >>> 16) & 0xff
  const bG = (b >>> 8) & 0xff
  const bB = b & 0xff

  const oA = Math.round(lerpNumber(aA, bA, tt))
  const oR = Math.round(lerpNumber(aR, bR, tt))
  const oG = Math.round(lerpNumber(aG, bG, tt))
  const oB = Math.round(lerpNumber(aB, bB, tt))
  return ((oA & 0xff) << 24) | ((oR & 0xff) << 16) | ((oG & 0xff) << 8) | (oB & 0xff)
}

function normalizeStops(colors: number[], stops?: number[] | null): number[] {
  invariant(colors.length >= 2, `Gradient requires >=2 colors, got ${colors.length}`)

  if (stops && stops.length) {
    invariant(stops.length === colors.length, 'Gradient: stops.length must match colors.length')
    return stops.map(clamp01)
  }

  const n = colors.length
  if (n === 1) return [0]
  const out = new Array<number>(n)
  for (let i = 0; i < n; i++) out[i] = i / (n - 1)
  return out
}

function sampleColor(colors: number[], stops: number[], t: number): number {
  invariant(colors.length >= 2, 'Gradient sampleColor: colors.length must be >= 2')
  invariant(stops.length === colors.length, 'Gradient sampleColor: stops.length must match colors.length')

  const tt = clamp01(t)
  if (tt <= stops[0]!) return colors[0]!
  if (tt >= stops[stops.length - 1]!) return colors[colors.length - 1]!

  // Find the segment [i, i+1] where stops[i] <= t <= stops[i+1]
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i]!
    const s1 = stops[i + 1]!
    if (tt >= s0 && tt <= s1) {
      const localT = s1 === s0 ? 0 : (tt - s0) / (s1 - s0)
      return lerpArgb(colors[i]!, colors[i + 1]!, localT)
    }
  }

  return colors[colors.length - 1]!
}

function interpolateColorsAndStops(
  aColors: number[],
  aStops: number[],
  bColors: number[],
  bStops: number[],
  t: number,
): ColorsAndStops {
  invariant(aColors.length >= 2, 'Gradient lerp: a.colors.length must be >= 2')
  invariant(bColors.length >= 2, 'Gradient lerp: b.colors.length must be >= 2')
  invariant(aStops.length === aColors.length, 'Gradient lerp: a.stops.length must match a.colors.length')
  invariant(bStops.length === bColors.length, 'Gradient lerp: b.stops.length must match b.colors.length')

  const set = new Set<number>()
  for (const s of aStops) set.add(clamp01(s))
  for (const s of bStops) set.add(clamp01(s))

  const mergedStops = Array.from(set).sort((x, y) => x - y)
  const mergedColors = mergedStops.map((s) => lerpArgb(sampleColor(aColors, aStops, s), sampleColor(bColors, bStops, s), t))

  return { colors: mergedColors, stops: mergedStops }
}

export abstract class GradientTransform {
  // In at 里 transform 返回 Matrix4；这里先提供最小能力：仅在 createShader 内对端点做变换。
  applyToPoint(_bounds: Rect, point: Offset): Offset {
    return point
  }
}

export class GradientRotation extends GradientTransform {
  constructor(public readonly radians: number) {
    super()
  }

  override applyToPoint(bounds: Rect, point: Offset): Offset {
    const c = new Offset(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
    const x = point.dx - c.dx
    const y = point.dy - c.dy
    const s = Math.sin(this.radians)
    const cc = Math.cos(this.radians)
    const xr = x * cc - y * s
    const yr = x * s + y * cc
    return new Offset(xr + c.dx, yr + c.dy)
  }
}

export abstract class Gradient {
  abstract createShader(bounds: Rect): Shader
  abstract debugDescription(): string

  static lerp(a: Gradient | null, b: Gradient | null, t: number): Gradient | null {
    if (a == null && b == null) return null
    if (a == null) return b!.scale(t)
    if (b == null) return a.scale(1 - t)

    // Same-kind interpolation
    if (a instanceof LinearGradient && b instanceof LinearGradient) {
      return LinearGradient.lerp(a, b, t)
    }
    if (a instanceof SolidColorGradient && b instanceof SolidColorGradient) {
      return new SolidColorGradient(lerpArgb(a.color, b.color, t))
    }

    // Fallback: fade out/in like at 的兜底策略（不保证完全一致）
    return t < 0.5 ? a.scale(1 - t * 2) : b.scale((t - 0.5) * 2)
  }

  // scale 主要用于 lerp fallback：将渐变整体淡入淡出（按 alpha 缩放）。
  scale(factor: number): Gradient {
    const f = clamp01(factor)

    if (this instanceof SolidColorGradient) {
      const a = (this.color >>> 24) & 0xff
      const na = Math.round(a * f)
      return new SolidColorGradient(((na & 0xff) << 24) | (this.color & 0x00ffffff))
    }

    if (this instanceof LinearGradient) {
      const colors = this.options.colors.map((c) => {
        const a = (c >>> 24) & 0xff
        const na = Math.round(a * f)
        return ((na & 0xff) << 24) | (c & 0x00ffffff)
      })
      return new LinearGradient({ ...this.options, colors })
    }

    if (this instanceof RadialGradient) {
      const colors = this.options.colors.map((c) => {
        const a = (c >>> 24) & 0xff
        const na = Math.round(a * f)
        return ((na & 0xff) << 24) | (c & 0x00ffffff)
      })
      return new RadialGradient({ ...this.options, colors })
    }

    if (this instanceof SweepGradient) {
      const colors = this.options.colors.map((c) => {
        const a = (c >>> 24) & 0xff
        const na = Math.round(a * f)
        return ((na & 0xff) << 24) | (c & 0x00ffffff)
      })
      return new SweepGradient({ ...this.options, colors })
    }

    return this
  }
}

export class SolidColorGradient extends Gradient {
  constructor(public readonly color: number) {
    super()
  }

  createShader(_bounds: Rect): Shader {
    return Shader.makeColor(this.color >>> 0)
  }

  debugDescription(): string {
    return `SolidColorGradient(0x${(this.color >>> 0).toString(16)})`
  }
}

export interface LinearGradientOptions {
  from: Offset
  to: Offset
  colors: number[]
  stops?: number[] | null
  tileMode?: TileMode
  transform?: GradientTransform | null
}

export class LinearGradient extends Gradient {
  constructor(public readonly options: LinearGradientOptions) {
    super()
    invariant(options.colors.length >= 2, `LinearGradient requires >=2 colors, got ${options.colors.length}`)
    if (options.stops != null) {
      invariant(options.stops.length === options.colors.length, 'LinearGradient: stops.length must match colors.length')
    }
  }

  static lerp(a: LinearGradient, b: LinearGradient, t: number): LinearGradient {
    const tt = clamp01(t)
    const aStops = normalizeStops(a.options.colors, a.options.stops)
    const bStops = normalizeStops(b.options.colors, b.options.stops)
    const { colors, stops } = interpolateColorsAndStops(a.options.colors, aStops, b.options.colors, bStops, tt)

    // Endpoint interpolation
    const from = new Offset(lerpNumber(a.options.from.dx, b.options.from.dx, tt), lerpNumber(a.options.from.dy, b.options.from.dy, tt))
    const to = new Offset(lerpNumber(a.options.to.dx, b.options.to.dx, tt), lerpNumber(a.options.to.dy, b.options.to.dy, tt))

    const tileMode = tt < 0.5 ? (a.options.tileMode ?? TileMode.Clamp) : (b.options.tileMode ?? TileMode.Clamp)
    const transform = tt < 0.5 ? (a.options.transform ?? null) : (b.options.transform ?? null)
    return new LinearGradient({ from, to, colors, stops, tileMode, transform })
  }

  createShader(_bounds: Rect): Shader {
    const { colors } = this.options
    const stops = normalizeStops(colors, this.options.stops)
    const tileMode = this.options.tileMode ?? TileMode.Clamp

    const tr = this.options.transform ?? null
    const from = tr ? tr.applyToPoint(_bounds, this.options.from) : this.options.from
    const to = tr ? tr.applyToPoint(_bounds, this.options.to) : this.options.to

    return Shader.makeLinearGradient(from.dx, from.dy, to.dx, to.dy, colors, stops, tileMode)
  }

  debugDescription(): string {
    const { from, to, colors } = this.options
    return `LinearGradient(from: ${from.toString?.() ?? `${from.dx},${from.dy}`}, to: ${to.toString?.() ?? `${to.dx},${to.dy}`}, colors: ${colors.length})`
  }
}

export interface RadialGradientOptions {
  center: Offset
  radius: number
  colors: number[]
  stops?: number[] | null
  tileMode?: TileMode
  transform?: GradientTransform | null
}

export class RadialGradient extends Gradient {
  constructor(public readonly options: RadialGradientOptions) {
    super()
    invariant(options.colors.length >= 2, `RadialGradient requires >=2 colors, got ${options.colors.length}`)
    if (options.stops != null) {
      invariant(options.stops.length === options.colors.length, 'RadialGradient: stops.length must match colors.length')
    }
    invariant(options.radius >= 0, 'RadialGradient: radius must be >= 0')
  }

  createShader(_bounds: Rect): Shader {
    // bindings 目前只提供 makeLinearGradient；如果需要 radial/sweep/conical，需要扩展 bindings 的 ShaderApi。
    throw new Error('RadialGradient.createShader: bindings.Shader does not support radial gradients yet')
  }

  debugDescription(): string {
    return `RadialGradient(center: ${this.options.center.dx},${this.options.center.dy}, radius: ${this.options.radius}, colors: ${this.options.colors.length})`
  }
}

export interface SweepGradientOptions {
  center: Offset
  colors: number[]
  stops?: number[] | null
  tileMode?: TileMode
  startAngle?: number
  endAngle?: number
  transform?: GradientTransform | null
}

export class SweepGradient extends Gradient {
  constructor(public readonly options: SweepGradientOptions) {
    super()
    invariant(options.colors.length >= 2, `SweepGradient requires >=2 colors, got ${options.colors.length}`)
    if (options.stops != null) {
      invariant(options.stops.length === options.colors.length, 'SweepGradient: stops.length must match colors.length')
    }
  }

  createShader(_bounds: Rect): Shader {
    throw new Error('SweepGradient.createShader: bindings.Shader does not support sweep gradients yet')
  }

  debugDescription(): string {
    return `SweepGradient(center: ${this.options.center.dx},${this.options.center.dy}, colors: ${this.options.colors.length})`
  }
}
