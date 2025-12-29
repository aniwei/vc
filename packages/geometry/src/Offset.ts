import { Size } from './Size'
import { Rect } from './Rect'

declare const require: (id: string) => unknown

export class Offset {
  static readonly ZERO = new Offset(0, 0)
  static readonly INFINITE = new Offset(Infinity, Infinity)

  static zero(): Offset {
    return new Offset(0, 0)
  }

  static lerp(a: Offset | null = null, b: Offset | null = null, t: number): Offset | null {
    if (t === null || Number.isNaN(t)) {
      throw new Error('The argument "t" cannot be null or NaN.')
    }

    if (b === null) {
      if (a === null) return null
      return a.multiply(1.0 - t)
    }

    if (a === null) {
      return b.multiply(t)
    }

    return new Offset(
      a.dx + (b.dx - a.dx) * t,
      a.dy + (b.dy - a.dy) * t,
    )
  }

  readonly dx: number
  readonly dy: number

  constructor(dx: number, dy: number) {
    this.dx = dx
    this.dy = dy
  }

  static of(dx: number, dy: number): Offset {
    return new Offset(dx, dy)
  }

  get distance(): number {
    return Math.sqrt(this.dx * this.dx + this.dy * this.dy)
  }

  get distanceSquared(): number {
    return this.dx * this.dx + this.dy * this.dy
  }

  get direction(): number {
    return Math.atan2(this.dy, this.dx)
  }

  translate(dx: number, dy: number): Offset {
    return new Offset(this.dx + dx, this.dy + dy)
  }

  add(other: Offset): Offset {
    return new Offset(this.dx + other.dx, this.dy + other.dy)
  }

  subtract(other: Offset): Offset {
    return new Offset(this.dx - other.dx, this.dy - other.dy)
  }

  multiply(operand: number): Offset {
    return new Offset(this.dx * operand, this.dy * operand)
  }

  divide(operand: number): Offset {
    return new Offset(this.dx / operand, this.dy / operand)
  }

  and(size: Size): Rect {    
    return Rect.fromLTWH(this.dx, this.dy, size.width, size.height)
  }
}
