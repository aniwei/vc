import type { Ptr } from '../types'
import { Api } from './Api'

export class ImageApi extends Api {
  makeFromEncoded(bytesPtr: Ptr, size: number): Ptr {
    return this.invoke('MakeImageFromEncoded', bytesPtr >>> 0, size | 0)
  }

  delete(image: Ptr): void {
    this.invoke('DeleteImage', image)
  }

  width(image: Ptr): number {
    return this.invoke('Image_width', image)
  }

  height(image: Ptr): number {
    return this.invoke('Image_height', image)
  }

  readPixelsRgba8888(image: Ptr, x: number, y: number, w: number, h: number, dst: Ptr, dstRowBytes: number): number {
    return this.invoke('Image_readPixelsRGBA8888', image, x | 0, y | 0, w | 0, h | 0, dst >>> 0, dstRowBytes | 0)
  }

  encodeToPng(image: Ptr): Ptr {
    return this.invoke('Image_encodeToPNG', image)
  }
}
