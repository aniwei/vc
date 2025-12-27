import { Api } from './Api'
import type { Ptr } from '../types'
import type { ClipOp, FilterMode, MipmapMode } from '../enums'

export class CanvasApi extends Api {
  clear(canvas: Ptr, argb: number): void {
    this.invoke('Canvas_clear', canvas, argb >>> 0)
  }

  save(canvas: Ptr): number {
    return this.invoke('Canvas_save', canvas) | 0
  }

  restore(canvas: Ptr): void {
    this.invoke('Canvas_restore', canvas)
  }

  translate(canvas: Ptr, dx: number, dy: number): void {
    this.invoke('Canvas_translate', canvas, +dx, +dy)
  }

  scale(canvas: Ptr, sx: number, sy: number): void {
    this.invoke('Canvas_scale', canvas, +sx, +sy)
  }

  rotate(canvas: Ptr, degrees: number): void {
    this.invoke('Canvas_rotate', canvas, +degrees)
  }

  concat(canvas: Ptr, m9Ptr: Ptr): void {
    this.invoke('Canvas_concat', canvas, m9Ptr >>> 0)
  }

  setMatrix(canvas: Ptr, m9Ptr: Ptr): void {
    this.invoke('Canvas_setMatrix', canvas, m9Ptr >>> 0)
  }

  clipRect(canvas: Ptr, l: number, t: number, r: number, b: number, clipOp: ClipOp, doAA: boolean): void {
    this.invoke('Canvas_clipRect', canvas, +l, +t, +r, +b, clipOp | 0, doAA ? 1 : 0)
  }

  drawRect(canvas: Ptr, l: number, t: number, r: number, b: number, paint: Ptr): void {
    this.invoke('Canvas_drawRect', canvas, +l, +t, +r, +b, paint)
  }

  drawPath(canvas: Ptr, path: Ptr, paint: Ptr): void {
    this.invoke('Canvas_drawPath', canvas, path, paint)
  }

  drawSkPath(canvas: Ptr, skPath: Ptr, paint: Ptr): void {
    this.invoke('Canvas_drawSkPath', canvas, skPath, paint)
  }

  drawCircle(canvas: Ptr, cx: number, cy: number, radius: number, paint: Ptr): void {
    this.invoke('Canvas_drawCircle', canvas, +cx, +cy, +radius, paint)
  }

  drawLine(canvas: Ptr, x0: number, y0: number, x1: number, y1: number, paint: Ptr): void {
    this.invoke('Canvas_drawLine', canvas, +x0, +y0, +x1, +y1, paint)
  }

  drawImage(canvas: Ptr, image: Ptr, x: number, y: number, filterMode: FilterMode, mipmapMode: MipmapMode): void {
    this.invoke('Canvas_drawImage', canvas, image, +x, +y, filterMode | 0, mipmapMode | 0)
  }

  drawImageWithPaint(
    canvas: Ptr,
    image: Ptr,
    x: number,
    y: number,
    filterMode: FilterMode,
    mipmapMode: MipmapMode,
    paint: Ptr
  ): void {
    this.invoke('Canvas_drawImageWithPaint', canvas, image, +x, +y, filterMode | 0, mipmapMode | 0, paint)
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
    filterMode: FilterMode,
    mipmapMode: MipmapMode
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

  drawImageRectWithPaint(
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
    filterMode: FilterMode,
    mipmapMode: MipmapMode,
    paint: Ptr
  ): void {
    this.invoke(
      'Canvas_drawImageRectWithPaint',
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
      mipmapMode | 0,
      paint
    )
  }

  drawTextBlob(canvas: Ptr, blob: Ptr, x: number, y: number, paint: Ptr): void {
    this.invoke('Canvas_drawTextBlob', canvas, blob, +x, +y, paint)
  }

  drawParagraph(canvas: Ptr, paragraph: Ptr, x: number, y: number): void {
    this.invoke('Canvas_drawParagraph', canvas, paragraph, +x, +y)
  }
}
