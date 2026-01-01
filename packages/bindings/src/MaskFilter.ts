import { DebugDescription, Eq } from 'shared'
import { BlurStyle } from './enums'
import { ManagedObj, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'


export class MaskFilter extends ManagedObj implements Eq<MaskFilter>, DebugDescription {
  static blur (blurStyle: BlurStyle, sigma: number) {
    return new MaskFilter(blurStyle, sigma)
  }

  protected blurStyle: BlurStyle
  protected sigma: number

  constructor (blurStyle: BlurStyle, sigma: number) {
    super()

    this.blurStyle = blurStyle
    this.sigma = sigma
  }

  resurrect (): Ptr {
    // return CanvasKitApi.MaskFilter.makeBlur(this.blurStyle, this.sigma, true)
    throw new Error('Method not implemented.')
  }

  eq (other: MaskFilter | null): boolean {
    return (
      other instanceof MaskFilter &&
      other.blurStyle === this.blurStyle &&
      other.sigma === this.sigma)
  }

  notEq (other: MaskFilter | null): boolean {
    return !this.eq(other)
  }

  debugDescription (): string {
    return `MaskFilter(blurStyle: ${this.blurStyle}, sigma: ${this.sigma})`
  }
}
