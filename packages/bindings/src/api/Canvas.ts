import type { Ptr } from '../types'
import { Api } from './Api'

export class Canvas extends Api {
  clear(canvas: Ptr, argb: number): void {
    this.invoke('Canvas_clear', canvas, argb >>> 0)
  }

  drawRect(canvas: Ptr, l: number, t: number, r: number, b: number, paint: Ptr): void {
    this.invoke('Canvas_drawRect', canvas, +l, +t, +r, +b, paint)
  }

  drawSkPath(canvas: Ptr, skPath: Ptr, paint: Ptr): void {
    this.invoke('Canvas_drawSkPath', canvas, skPath, paint)
  }

  drawImage(canvas: Ptr, image: Ptr, x: number, y: number, filterMode: number, mipmapMode: number): void {
    this.invoke('Canvas_drawImage', canvas, image, +x, +y, filterMode | 0, mipmapMode | 0)
  }

  drawImageRect(
    canvas: Ptr,
    image: Ptr,
    srcL: number,
    srcT: number,
    srcR: number,
    srcB: number,
    dstL: number,
    dstT: number,
    dstR: number,
    dstB: number,
    filterMode: number,
    mipmapMode: number
  ): void {
    this.invoke(
      'Canvas_drawImageRect',
      canvas,
      image,
      +srcL,
      +srcT,
      +srcR,
      +srcB,
      +dstL,
      +dstT,
      +dstR,
      +dstB,
      filterMode | 0,
      mipmapMode | 0
    )
  }

  drawTextBlob(canvas: Ptr, blob: Ptr, x: number, y: number, paint: Ptr): void {
    this.invoke('Canvas_drawTextBlob', canvas, blob, +x, +y, paint)
  }

  drawParagraph(canvas: Ptr, paragraph: Ptr, x: number, y: number): void {
    this.invoke('Canvas_drawParagraph', canvas, paragraph, +x, +y)
  }
}
