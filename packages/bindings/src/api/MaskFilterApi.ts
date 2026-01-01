import type { Ptr } from '../types'
import { Api } from './Api'

export class MaskFilterApi extends Api {
  delete(maskFilter: Ptr): void {
    this.invoke('DeleteMaskFilter', maskFilter)
  }

  makeBlur(blurStyle: number, sigma: number, respectCTM: boolean): Ptr {
    return this.invoke('MakeBlurMaskFilter', blurStyle | 0, +sigma, respectCTM ? 1 : 0)
  }
}
