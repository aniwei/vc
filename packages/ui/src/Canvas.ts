import type { CanvasLike, LTRBRect } from 'painting'

export interface CanvasOptions {
  filterMode?: number
  mipmapMode?: number
}

/**
 * Adapter for the cheap bindings CanvasKit-style API object.
 *
 * Expected API shape (minimum):
 * - api.canvasDrawImageRect(canvasPtr, imagePtr, srcL, srcT, srcR, srcB, dstL, dstT, dstR, dstB, filterMode, mipmapMode)
 */
export class Canvas implements CanvasLike {
  private readonly filterMode: number
  private readonly mipmapMode: number

  constructor(
    private readonly api: any,
    private readonly canvasPtr: any,
    options: CanvasOptions = {},
  ) {
    this.filterMode = options.filterMode ?? 1
    this.mipmapMode = options.mipmapMode ?? 0
  }

  save(): void {
    this.api?.canvasSave?.(this.canvasPtr)
  }

  restore(): void {
    this.api?.canvasRestore?.(this.canvasPtr)
  }

  clipRect(_rect: LTRBRect, _op?: unknown): void {
    // Cheap bindings wrapper may not expose clip yet.
    // Keep it as a no-op to allow basic painting to work.
    this.api?.canvasClipRect?.(this.canvasPtr, _rect[0], _rect[1], _rect[2], _rect[3])
  }

  translate(dx: number, dy: number): void {
    this.api?.canvasTranslate?.(this.canvasPtr, +dx, +dy)
  }

  scale(sx: number, sy: number): void {
    this.api?.canvasScale?.(this.canvasPtr, +sx, +sy)
  }

  drawImageRect(image: unknown, src: LTRBRect, dst: LTRBRect, _paint?: unknown): void {
    const imagePtr = (image && typeof image === 'object' && 'ptr' in (image as any)) ? (image as any).ptr : image

    const fn = this.api?.canvasDrawImageRect
    if (typeof fn !== 'function') {
      throw new Error('CheapBindingsCanvas: api.canvasDrawImageRect is not a function')
    }

    fn(
      this.canvasPtr,
      imagePtr,
      src[0],
      src[1],
      src[2],
      src[3],
      dst[0],
      dst[1],
      dst[2],
      dst[3],
      this.filterMode,
      this.mipmapMode,
    )
  }

  drawImageNine(_image: unknown, _center: LTRBRect, _dst: LTRBRect, _paint?: unknown): void {
    throw new Error('CheapBindingsCanvas: drawImageNine is not implemented for cheap bindings adapter')
  }
}
