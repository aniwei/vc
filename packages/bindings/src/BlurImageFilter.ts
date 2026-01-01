import { TileMode } from './enums'
import { ImageFilter } from './ImageFilter'
import { Ptr } from './ManagedObj'


//// => BlurImageFilter
// 图片模糊滤镜
export class BlurImageFilter extends ImageFilter {

  get mode () {
    switch (this.tileMode) {
      case TileMode.Clamp:
        return 'clamp'
      case TileMode.Mirror:
        return 'mirror'
      case TileMode.Repeat:
        return 'repeated'
      case TileMode.Decal:
        return 'decal'
    }
  }

  protected sigmaX: number
  protected sigmaY: number 
  protected tileMode: TileMode

  constructor (sigmaX: number, sigmaY: number, tileMode: TileMode) {
    super()

    this.sigmaX = sigmaX
    this.sigmaY = sigmaY
    this.tileMode = tileMode
  }

  resurrect(): Ptr {
    throw new Error('Method not implemented.')
  }

  eq (other: BlurImageFilter | null): boolean {
    return (
      other instanceof BlurImageFilter &&
      other.sigmaX === this.sigmaX &&
      other.sigmaY === this.sigmaY &&
      other.tileMode === this.tileMode)
  }

  notEq (other: BlurImageFilter | null): boolean {
    return !this.eq(other)
  }

  toString(): string {
    return `BlurImageFilter(
      sigmaX: ${this.sigmaX}, 
      sigmaY: ${this.sigmaY}, 
      mode: ${this.mode})`
  }
 
  debugDescription () {
    return this.toString()
  }
}
