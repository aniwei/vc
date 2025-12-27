export class Size {
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

  div(scale: number): Size {
    return new Size(this.width / scale, this.height / scale)
  }

  add(other: Size): Size {
    return new Size(this.width + other.width, this.height + other.height)
  }

  sub(other: Size): Size {
    return new Size(this.width - other.width, this.height - other.height)
  }
}

export class Offset {
  static readonly ZERO = new Offset(0, 0)

  readonly dx: number
  readonly dy: number

  constructor(dx: number, dy: number) {
    this.dx = dx
    this.dy = dy
  }

  static of(dx: number, dy: number): Offset {
    return new Offset(dx, dy)
  }

  translate(dx: number, dy: number): Offset {
    return new Offset(this.dx + dx, this.dy + dy)
  }

  and(size: Size): Rect {
    return Rect.fromLTWH(this.dx, this.dy, size.width, size.height)
  }
}

interface LTRB extends Array<number> {
  0: number
  1: number
  2: number
  3: number
}

export class Rect {
  static fromLTWH(left: number, top: number, width: number, height: number): Rect {
    return new Rect(left, top, left + width, top + height)
  }

  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number

  constructor(left: number, top: number, right: number, bottom: number) {
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
  }

  static fromLTRB(left: number, top: number, right: number, bottom: number): Rect {
    return new Rect(left, top, right, bottom)
  }

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

  isEmpty(): boolean {
    return this.width <= 0 || this.height <= 0
  }

  add(size: Size): Rect {
    return Rect.fromLTWH(this.left, this.top, this.width + size.width, this.height + size.height)
  }

  sub(size: Size): Rect {
    return Rect.fromLTWH(this.left, this.top, this.width - size.width, this.height - size.height)
  }

  eq(other: Rect | null): boolean {
    return (
      !!other &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom
    )
  }

  toLTRB(): LTRB {
    return [this.left, this.top, this.right, this.bottom]
  }
}

export class Matrix4 {
  // Column-major 4x4 (like many graphics libs). Stored as length-16 Float32Array.
  readonly storage: Float32Array

  constructor(storage?: Float32Array) {
    this.storage = storage ?? Matrix4.identity().storage
  }

  static identity(): Matrix4 {
    const m = new Float32Array(16)
    m[0] = 1
    m[5] = 1
    m[10] = 1
    m[15] = 1
    return new Matrix4(m)
  }

  static translationValues(tx: number, ty: number, tz: number): Matrix4 {
    const m = Matrix4.identity().storage
    m[12] = tx
    m[13] = ty
    m[14] = tz
    return new Matrix4(m)
  }
}
