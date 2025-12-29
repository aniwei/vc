import { Offset } from 'bindings'

export interface ShadowOptions {
  color?: number
  offset?: Offset
  blurRadius?: number
}

export class Shadow {
  public readonly color: number
  public readonly offset: Offset
  public readonly blurRadius: number

  // Back-compat: previous constructor was (x, y, blur, spread?)
  constructor(options?: ShadowOptions)
  constructor(x: number, y: number, blur: number, _spread?: number)
  constructor(a: ShadowOptions | number = {}, b?: number, c?: number, _d?: number) {
    // Old signature
    if (typeof a === 'number' && typeof b === 'number' && typeof c === 'number') {
      this.color = 0x55000000
      this.offset = new Offset(a, b)
      this.blurRadius = c
      return
    }

    const opt = (a ?? {}) as ShadowOptions
    this.color = (opt.color ?? 0x55000000) >>> 0
    this.offset = opt.offset ?? Offset.ZERO
    this.blurRadius = opt.blurRadius ?? 0
  }

  get x(): number {
    return this.offset.dx
  }

  get y(): number {
    return this.offset.dy
  }

  get blur(): number {
    return this.blurRadius
  }

  // spread is BoxShadow-specific; kept for back-compat.
  get spread(): number {
    return 0
  }

  scale(factor: number): Shadow {
    return new Shadow({
      color: this.color,
      offset: new Offset(this.offset.dx * factor, this.offset.dy * factor),
      blurRadius: this.blurRadius * factor,
    })
  }

  static lerp(a: Shadow | null, b: Shadow | null, t: number): Shadow | null {
    if (a === null && b === null) return null
    if (a === null) return b!.scale(t)
    if (b === null) return a.scale(1 - t)

    const lerpNum = (x: number, y: number) => x + (y - x) * t
    const lerpColor = (ca: number, cb: number) => {
      const aA = (ca >>> 24) & 0xff
      const aR = (ca >>> 16) & 0xff
      const aG = (ca >>> 8) & 0xff
      const aB = ca & 0xff

      const bA = (cb >>> 24) & 0xff
      const bR = (cb >>> 16) & 0xff
      const bG = (cb >>> 8) & 0xff
      const bB = cb & 0xff

      const A = Math.round(lerpNum(aA, bA))
      const R = Math.round(lerpNum(aR, bR))
      const G = Math.round(lerpNum(aG, bG))
      const B = Math.round(lerpNum(aB, bB))
      return ((A << 24) | (R << 16) | (G << 8) | B) >>> 0
    }

    return new Shadow({
      color: lerpColor(a.color, b.color),
      offset: new Offset(lerpNum(a.offset.dx, b.offset.dx), lerpNum(a.offset.dy, b.offset.dy)),
      blurRadius: lerpNum(a.blurRadius, b.blurRadius),
    })
  }

  eq(other: Shadow | null): boolean {
    return (
      other instanceof Shadow &&
      other.color === this.color &&
      other.offset.dx === this.offset.dx &&
      other.offset.dy === this.offset.dy &&
      other.blurRadius === this.blurRadius
    )
  }

  notEq(other: Shadow | null): boolean {
    return !this.eq(other)
  }
}

export type ShapeShadow = Shadow
export type ShapeShadows = Shadow[]
