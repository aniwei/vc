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
}

export class Rect {
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

  toLTRB(): [number, number, number, number] {
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
