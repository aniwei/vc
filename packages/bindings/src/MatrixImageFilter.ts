import { listEquals } from 'shared'
import { FilterQuality } from './enums'
import { ImageFilter } from './ImageFilter'
import { Ptr } from './ManagedObj'

//// => MatrixImageFilter
// 矩阵滤镜
export class MatrixImageFilter extends ImageFilter {
  protected matrix: number[]
  protected quality: FilterQuality

  constructor (matrix: number[], quality: FilterQuality) {
    super()

    this.matrix = matrix
    this.quality = quality
  }

  resurrect(): Ptr {
    // TODO
    throw new Error('Method not implemented.')
  }

  eq (other: MatrixImageFilter | null): boolean {
    
    return (
      other instanceof MatrixImageFilter &&
      this.quality === other.quality &&
      listEquals<number>(this.matrix, other.matrix))
  }

  notEq(other: unknown): boolean {
    return !this.eq(other as MatrixImageFilter | null)
  }

  toString () {
    return `MatrixImageFilter(matrix: ${this.matrix}, quality: ${this.quality})`
  }

  /**
   * 输出字符串
   * @returns 
   */
  debugDescription () {
    return this.toString()
  } 
}
