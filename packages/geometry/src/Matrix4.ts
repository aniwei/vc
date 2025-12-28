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
