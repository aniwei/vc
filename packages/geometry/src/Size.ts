import { Eq, DebugDescription } from 'shared'

export class Size implements Eq<Size>, DebugDescription {
  static lerp(a: Size | null = null, b: Size | null = null, t: number): Size | null {
    if (t === null || Number.isNaN(t)) {
      throw new Error('The argument "t" cannot be null or NaN.')
    }

    if (b === null) {
      if (a === null) return null
      return a.mul(1.0 - t)
    }

    if (a === null) {
      return b.mul(t)
    }

    return new Size(
      a.width + (b.width - a.width) * t,
      a.height + (b.height - a.height) * t,
    )
  }

  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {}

  isEmpty(): boolean {
    return this.width <= 0 || this.height <= 0
  }

  mul(scale: number): Size {
    return new Size(this.width * scale, this.height * scale)
  }

  div(scale: number): Size {
    return new Size(this.width / scale, this.height / scale)
  }

  add(other: Size): Size {
    return new Size(this.width + other.width, this.height + other.height)
  }

  sub(other: Size): Size {
    return new Size(this.width - other.width, this.height - other.height)
  }

  eq(other: Size | null): boolean {
    return !!other && other.width === this.width && other.height === this.height
  }

  notEq(other: Size | null): boolean {
    return !this.eq(other)
  }

  debugDescription(): string {
    return `Size(${this.width}, ${this.height})`
  }
}