import type { Ptr } from '../types'
import { Api } from './Api'

export class SurfaceApi extends Api {
  makeSw(w: number, h: number): Ptr {
    return this.invoke('MakeSWCanvasSurface', w | 0, h | 0)
  }

  delete(surface: Ptr): void {
    this.invoke('DeleteSurface', surface)
  }

  getCanvas(surface: Ptr): Ptr {
    return this.invoke('Surface_getCanvas', surface)
  }

  makeImageSnapshot(surface: Ptr): Ptr {
    return this.invoke('Surface_makeImageSnapshot', surface)
  }

  flush(surface: Ptr): void {
    this.invoke('Surface_flush', surface)
  }

  width(surface: Ptr): number {
    return this.invoke('Surface_width', surface) | 0
  }

  height(surface: Ptr): number {
    return this.invoke('Surface_height', surface) | 0
  }

  encodeToPng(surface: Ptr): Ptr {
    return this.invoke('Surface_encodeToPNG', surface)
  }

  readPixelsRgba8888(surface: Ptr, x: number, y: number, w: number, h: number, dst: Ptr, dstRowBytes: number): number {
    return this.invoke('Surface_readPixelsRGBA8888', surface, x | 0, y | 0, w | 0, h | 0, dst >>> 0, dstRowBytes | 0)
  }
}
