export class Size {
  static lerp(a: Size | null = null, b: Size | null = null, t: number): Size | null {
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

  eq(other: Size | null): boolean {
    return !!other && other.width === this.width && other.height === this.height
  }

  mul(scale: number): Size {
    return new Size(this.width * scale, this.height * scale)
  }

  multiply(operand: number): Size {
    return this.mul(operand)
  }

  div(scale: number): Size {
    return new Size(this.width / scale, this.height / scale)
  }

  divide(operand: number): Size {
    return this.div(operand)
  }

  add(other: Size): Size {
    return new Size(this.width + other.width, this.height + other.height)
  }

  sub(other: Size): Size {
    return new Size(this.width - other.width, this.height - other.height)
  }

  subtract(other: Size): Size {
    return this.sub(other)
  }
}
