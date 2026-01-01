import { Api } from './Api'
import type { Ptr } from '../types'

export class ShaderApi extends Api {
  makeColor(argb: number): Ptr {
    return this.invoke('MakeColorShader', argb >>> 0) as Ptr
  }

  makeLinearGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    colorsPtr: Ptr,
    positionsPtr: Ptr,
    count: number,
    tileMode: number,
  ): Ptr {
    return this.invoke(
      'MakeLinearGradientShader',
      +x0,
      +y0,
      +x1,
      +y1,
      colorsPtr >>> 0,
      positionsPtr >>> 0,
      count | 0,
      tileMode | 0,
    ) as Ptr
  }

  delete(shader: Ptr): void {
    this.invoke('DeleteShader', shader >>> 0)
  }
}
