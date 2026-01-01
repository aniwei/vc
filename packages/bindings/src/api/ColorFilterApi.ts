import type { Ptr } from '../types'
import { Api } from './Api'

export class ColorFilterApi extends Api {
  delete(colorFilter: Ptr): void {
    this.invoke('DeleteColorFilter', colorFilter)
  }

  makeBlend(argb: number, blendMode: number): Ptr {
    return this.invoke('MakeBlendColorFilter', argb >>> 0, blendMode | 0)
  }

  makeMatrix(rowMajor20: ArrayLike<number> | Float32Array): Ptr {
    const len = rowMajor20.length >>> 0
    if (len !== 20) {
      throw new Error(`ColorFilter.MakeMatrix expects 20 floats, got ${len}`)
    }

    const bytes = 20 * 4
    const ptr = this.malloc(bytes)
    try {
      this.setFloat32Array(ptr, rowMajor20)
      return this.invoke('MakeMatrixColorFilter', ptr)
    } finally {
      this.free(ptr)
    }
  }

  makeLinearToSRGBGamma(): Ptr {
    return this.invoke('MakeLinearToSRGBGammaColorFilter')
  }

  makeSRGBToLinearGamma(): Ptr {
    return this.invoke('MakeSRGBToLinearGammaColorFilter')
  }
}
