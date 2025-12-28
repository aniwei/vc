import invariant from 'invariant'

import { Offset, Rect } from 'geometry'
import { Shader } from 'bindings'

export abstract class Gradient {
  abstract createShader(bounds: Rect): Shader
  abstract toString(): string
}

export class SolidColorGradient extends Gradient {
  constructor(public readonly color: number) {
    super()
  }

  createShader(_bounds: Rect): Shader {
    return Shader.makeColor(this.color >>> 0)
  }

  toString(): string {
    return `SolidColorGradient(0x${(this.color >>> 0).toString(16)})`
  }
}

export interface LinearGradientOptions {
  from: Offset
  to: Offset
  colors: number[]
  stops?: number[] | null
  // tileMode is SkTileMode int; default Clamp(0)
  tileMode?: number
}

export class LinearGradient extends Gradient {
  constructor(public readonly options: LinearGradientOptions) {
    super()
    invariant(options.colors.length >= 2, `LinearGradient requires >=2 colors, got ${options.colors.length}`)
    if (options.stops != null) {
      invariant(options.stops.length === options.colors.length, 'LinearGradient: stops.length must match colors.length')
    }
  }

  createShader(_bounds: Rect): Shader {
    const { from, to, colors, stops, tileMode } = this.options
    return Shader.makeLinearGradient(from.dx, from.dy, to.dx, to.dy, colors, stops ?? null, tileMode ?? 0)
  }

  toString(): string {
    const { from, to, colors } = this.options
    return `LinearGradient(from=${from.toString?.() ?? `${from.dx},${from.dy}`}, to=${to.toString?.() ?? `${to.dx},${to.dy}`}, colors=${colors.length})`
  }
}
