import { Eq } from 'shared'

export class Mat4 extends Eq<Mat4> {
  readonly storage: Float32Array

  constructor(storage?: ArrayLike<number> | Float32Array) {
    super()
    
    if (!storage) {
      this.storage = Mat4.identity().storage
      return
    }

    if (storage instanceof Float32Array) {
      if (storage.length !== 16) {
        throw new Error('Mat4: expected Float32Array(16)')
      }
      this.storage = storage
      return
    }

    if (storage.length !== 16) {
      throw new Error('Mat4: expected 16 values')
    }

    const m = new Float32Array(16)
    for (let i = 0; i < 16; i++) {
      m[i] = +storage[i]
    }
    this.storage = m
  }

  static fromArray(values: ArrayLike<number>): Mat4 {
    return new Mat4(values)
  }

  static identity(): Mat4 {
    const m = new Float32Array(16)
    m[0] = 1
    m[5] = 1
    m[10] = 1
    m[15] = 1
    return new Mat4(m)
  }

  static translationValues(tx: number, ty: number, tz: number): Mat4 {
    const m = Mat4.identity().storage
    m[12] = +tx
    m[13] = +ty
    m[14] = +tz
    return new Mat4(m)
  }

  clone(): Mat4 {
    return new Mat4(new Float32Array(this.storage))
  }

  // Returns this * other (column-major multiplication).
  multiplied(other: Mat4): Mat4 {
    const a = this.storage
    const b = other.storage

    const out = new Float32Array(16)

    // Column-major: out = a * b
    for (let col = 0; col < 4; col++) {
      const b0 = b[col * 4 + 0]
      const b1 = b[col * 4 + 1]
      const b2 = b[col * 4 + 2]
      const b3 = b[col * 4 + 3]

      out[col * 4 + 0] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3
      out[col * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3
      out[col * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3
      out[col * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3
    }

    return new Mat4(out)
  }

  // In-place: this = this * other (column-major).
  mul(other: Mat4) {
    const a = this.storage
    const b = other.storage

    const out = new Float32Array(16)

    for (let col = 0; col < 4; col++) {
      const b0 = b[col * 4 + 0]
      const b1 = b[col * 4 + 1]
      const b2 = b[col * 4 + 2]
      const b3 = b[col * 4 + 3]

      out[col * 4 + 0] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3
      out[col * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3
      out[col * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3
      out[col * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3
    }

    this.storage.set(out)
  }
  
  translate(tx: number, ty: number, tz: number = 0) {
    this.mul(Mat4.translationValues(tx, ty, tz))
  }

  // In-place: this = this * other^T (column-major).
  multiplyTranspose(other: Mat4) {
    const m = this.storage
    const o = other.storage

    const m00 = m[0]
    const m01 = m[4]
    const m02 = m[8]
    const m03 = m[12]

    const m10 = m[1]
    const m11 = m[5]
    const m12 = m[9]
    const m13 = m[13]

    const m20 = m[2]
    const m21 = m[6]
    const m22 = m[10]
    const m23 = m[14]

    const m30 = m[3]
    const m31 = m[7]
    const m32 = m[11]
    const m33 = m[15]

    m[0] = m00 * o[0] + m01 * o[4] + m02 * o[8] + m03 * o[12]
    m[4] = m00 * o[1] + m01 * o[5] + m02 * o[9] + m03 * o[13]
    m[8] = m00 * o[2] + m01 * o[6] + m02 * o[10] + m03 * o[14]
    m[12] = m00 * o[3] + m01 * o[7] + m02 * o[11] + m03 * o[15]

    m[1] = m10 * o[0] + m11 * o[4] + m12 * o[8] + m13 * o[12]
    m[5] = m10 * o[1] + m11 * o[5] + m12 * o[9] + m13 * o[13]
    m[9] = m10 * o[2] + m11 * o[6] + m12 * o[10] + m13 * o[14]
    m[13] = m10 * o[3] + m11 * o[7] + m12 * o[11] + m13 * o[15]

    m[2] = m20 * o[0] + m21 * o[4] + m22 * o[8] + m23 * o[12]
    m[6] = m20 * o[1] + m21 * o[5] + m22 * o[9] + m23 * o[13]
    m[10] = m20 * o[2] + m21 * o[6] + m22 * o[10] + m23 * o[14]
    m[14] = m20 * o[3] + m21 * o[7] + m22 * o[11] + m23 * o[15]

    m[3] = m30 * o[0] + m31 * o[4] + m32 * o[8] + m33 * o[12]
    m[7] = m30 * o[1] + m31 * o[5] + m32 * o[9] + m33 * o[13]
    m[11] = m30 * o[2] + m31 * o[6] + m32 * o[10] + m33 * o[14]
    m[15] = m30 * o[3] + m31 * o[7] + m32 * o[11] + m33 * o[15]
  }

  eq(other: Mat4): boolean {
    for (let i = 0; i < 16; i++) {
      if (this.storage[i] !== other.storage[i]) {
        return false
      }
    }

    return true
  }
  
  notEq(other: Mat4): boolean {
    return !this.eq(other)
  }
}
