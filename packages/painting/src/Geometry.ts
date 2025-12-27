export class Size {
  static create(width: number, height: number): Size {
    return new Size(width, height)
  }

  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {}

  get isEmpty(): boolean {
    return this.width <= 0 || this.height <= 0
  }

  equal(other: Size | null): boolean {
    return !!other && other.width === this.width && other.height === this.height
  }

  multiply(scale: number): Size {
    return new Size(this.width * scale, this.height * scale)
  }

  divide(scale: number): Size {
    return new Size(this.width / scale, this.height / scale)
  }

  add(other: Size): Size {
    return new Size(this.width + other.width, this.height + other.height)
  }

  subtract(other: Size): Size {
    return new Size(this.width - other.width, this.height - other.height)
  }
}

export class Offset {
  static readonly ZERO = new Offset(0, 0)

  static create(dx: number, dy: number): Offset {
    return new Offset(dx, dy)
  }

  constructor(
    public readonly dx: number,
    public readonly dy: number,
  ) {}

  translate(dx: number, dy: number): Offset {
    return new Offset(this.dx + dx, this.dy + dy)
  }

  and(size: Size): Rect {
    return Rect.fromLTWH(this.dx, this.dy, size.width, size.height)
  }
}

export class Rect {
  static fromLTWH(left: number, top: number, width: number, height: number): Rect {
    return new Rect(left, top, left + width, top + height)
  }

  constructor(
    public readonly left: number,
    public readonly top: number,
    public readonly right: number,
    public readonly bottom: number,
  ) {}

  get width(): number {
    return this.right - this.left
  }

  get height(): number {
    return this.bottom - this.top
  }

  get size(): Size {
    return new Size(this.width, this.height)
  }

  get topLeft(): Offset {
    return new Offset(this.left, this.top)
  }

  get isEmpty(): boolean {
    return this.width <= 0 || this.height <= 0
  }

  add(size: Size): Rect {
    return Rect.fromLTWH(this.left, this.top, this.width + size.width, this.height + size.height)
  }

  subtract(size: Size): Rect {
    return Rect.fromLTWH(this.left, this.top, this.width - size.width, this.height - size.height)
  }

  equal(other: Rect | null): boolean {
    return (
      !!other &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom
    )
  }
}
