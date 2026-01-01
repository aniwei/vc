import { listEquals } from 'shared'
import { ColorFilter } from './ColorFilter'
import { CanvasKitApi } from './CanvasKitApi'
import type { Ptr } from './types'

export class MatrixColorFilter extends ColorFilter {
  protected matrix: number[]

  /**
   * @param {number[]} matrix
   * @return {*}
   */  
  constructor (matrix: number[]) {
    super()

    this.matrix = matrix
  }

  eq (other: MatrixColorFilter | null) {
    return (
      other instanceof MatrixColorFilter &&
      listEquals<number>(this.matrix, other.matrix)
    )
  }

  notEq (other: MatrixColorFilter | null) {
    return !this.eq(other)
  }

  toString () {
    return `MatrixColorFilter(${this.matrix})`
  }

  createRawColorFilter(): Ptr {
    return CanvasKitApi.ColorFilter.makeMatrix(this.matrix)
  }

  debugDescription(): string {
    return this.toString()
  }
}
