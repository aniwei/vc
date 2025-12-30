import { Eq, DebugDescription } from 'shared'
import { Point } from './Point'

export class Radius extends Point implements Eq<Radius>, DebugDescription {
  static readonly Zero = new Radius(0, 0)

  static circular(radius: number): Radius {
    return new Radius(radius, radius)
  }

  static elliptical(x: number, y: number): Radius {
    return new Radius(x, y)
  }

  static lerp(a: Radius | null, b: Radius | null, t: number): Radius | null {
    if (a === null && b === null) return null
    a ??= Radius.Zero
    b ??= Radius.Zero
    return new Radius(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
  }

  constructor(x: number, y: number) {
    super(x, y)
  }

  inverse(): Radius {
    return new Radius(-this.x, -this.y)
  }

  add(other: Radius): Radius {
    return new Radius(this.x + other.x, this.y + other.y)
  }

  sub(other: Radius): Radius {
    return new Radius(this.x - other.x, this.y - other.y)
  }

  mul(scale: number): Radius {
    return new Radius(this.x * scale, this.y * scale)
  }

  div(scale: number): Radius {
    return new Radius(this.x / scale, this.y / scale)
  }

  mod(divisor: number): Radius {
    return new Radius(this.x % divisor, this.y % divisor)
  }

  clone(): Radius {
    return new Radius(this.x, this.y)
  }

  eq(other: Radius | null): boolean {
    return !!other && other.x === this.x && other.y === this.y
  }

  notEq(other: Radius | null): boolean {
    return !this.eq(other)
  }

  debugDescription(): string {
    return `Radius(${this.x}, ${this.y})`
  }
}
