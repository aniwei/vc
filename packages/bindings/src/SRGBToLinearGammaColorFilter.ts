import { ColorFilter } from './ColorFilter'
import { CanvasKitApi } from './CanvasKitApi'
import type { Ptr } from './types'

export class SRGBToLinearGammaColorFilter extends ColorFilter {
  createRawColorFilter(): Ptr {
    return CanvasKitApi.ColorFilter.makeSRGBToLinearGamma()
  }

  eq (other: SRGBToLinearGammaColorFilter | null) {
    return (
      other instanceof SRGBToLinearGammaColorFilter &&
      other === this)
  }

  notEq (other: SRGBToLinearGammaColorFilter | null) {
    return !this.eq(other)
  }
  
  toString () {
    return 'SRGBToLinearGammaColorFilter()'
  }

  debugDescription(): string {
    return this.toString()
  }
}
