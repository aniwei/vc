import { ColorFilter } from './ColorFilter'
import { CanvasKitApi } from './CanvasKitApi'
import type { Ptr } from './types'


export class LinearToSRGBGammaColorFilter extends ColorFilter {
  createRawColorFilter(): Ptr {
    return CanvasKitApi.ColorFilter.makeLinearToSRGBGamma()
  }

  eq (other: LinearToSRGBGammaColorFilter | null) {
    return (
      other instanceof LinearToSRGBGammaColorFilter &&
      other === this)
  }

  notEq (other: LinearToSRGBGammaColorFilter | null) {
    return !this.eq(other)
  }

  toString () {
    return `LinearToSRGBGammaColorFilter()`
  }

  debugDescription(): string {
    return this.toString()
  }
}
