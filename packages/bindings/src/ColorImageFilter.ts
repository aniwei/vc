import { ImageFilter } from './ImageFilter'
import { ColorFilter } from './ColorFilter'
import { Ptr } from './ManagedObj'

export class ColorImageFilter extends ImageFilter {
  
  protected color: ColorFilter
  
  constructor (color: ColorFilter) {
    super()
    this.color = color
  }

  resurrect(): Ptr {
    // TODO
    throw new Error('Method not implemented.')
  }

  eq (other: ColorImageFilter | null): boolean {
    return (
      other instanceof ColorImageFilter &&
      this.color === other.color)
  }

  notEq (other: ColorImageFilter | null): boolean {
    return !this.eq(other)
  }
  
  debugDescription (): string {
    return `ColorImageFilter(color: ${this.color.debugDescription()})`
  }
}
