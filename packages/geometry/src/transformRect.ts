import { Mat4 } from './Mat4'
import { Rect } from './Rect'

const kRect = new Float32Array(4)
const kPoint = new Float32Array(16)
const kMatrix = Mat4.fromArray(kPoint)

/**
 * @description: 
 * @param {Matrix4} transform
 * @param {Float32Array} ltrb
 * @return {*}
 */
export function transformLTRB (transform: Mat4, ltrb: Float32Array) {
  kPoint[0] = ltrb[0]
  kPoint[4] = ltrb[1]
  kPoint[8] = 0
  kPoint[12] = 1

  // Row 1: top-right
  kPoint[1] = ltrb[2]
  kPoint[5] = ltrb[1]
  kPoint[9] = 0
  kPoint[13] = 1

  // Row 2: bottom-left
  kPoint[2] = ltrb[0]
  kPoint[6] = ltrb[3]
  kPoint[10] = 0
  kPoint[14] = 1

  // Row 3: bottom-right
  kPoint[3] = ltrb[2]
  kPoint[7] = ltrb[3]
  kPoint[11] = 0
  kPoint[15] = 1

  kMatrix.multiplyTranspose(transform);

  let w = transform.storage[15]
  if (w === 0) {
    w = 1
  }

  ltrb[0] = Math.min(Math.min(Math.min(kPoint[0], kPoint[1]), kPoint[2]), kPoint[3]) / w
  ltrb[1] = Math.min(Math.min(Math.min(kPoint[4], kPoint[5]), kPoint[6]), kPoint[7]) / w
  ltrb[2] = Math.max(Math.max(Math.max(kPoint[0], kPoint[1]), kPoint[2]), kPoint[3]) / w
  ltrb[3] = Math.max(Math.max(Math.max(kPoint[4], kPoint[5]), kPoint[6]), kPoint[7]) / w
}

export function transformRect (transform: Mat4, rect: Rect) {
  kRect[0] = rect.left
  kRect[1] = rect.top
  kRect[2] = rect.right
  kRect[3] = rect.bottom
  transformLTRB(transform, kRect)
  return Rect.fromLTRB(
    kRect[0],
    kRect[1],
    kRect[2],
    kRect[3])
}