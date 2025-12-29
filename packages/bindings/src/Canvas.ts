import invariant from 'invariant'

import { ManagedObj, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'
import { Rect } from './Geometry'

import { FilterMode, MipmapMode } from './enums'
import type { ClipOp } from './enums'
import { Paint } from './Paint'
import type { Path } from './Path'
import type { Image } from './Image'

type LTRBRect = readonly [number, number, number, number]

export interface ImagePaint {
  opacity?: number
  filterMode?: FilterMode
  mipmapMode?: MipmapMode
}

function writeF32Array(ptr: number, values: ArrayLike<number>): void {
  const heap = CanvasKitApi.heapU8()
  const f32 = new Float32Array(heap.buffer)
  const off = (ptr >>> 0) >>> 2
  for (let i = 0; i < values.length; i++) {
    f32[off + i] = +values[i]
  }
}

function allocF32Array(values: ArrayLike<number>): number {
  const ptr = CanvasKitApi.malloc(values.length * 4) as number
  writeF32Array(ptr, values)
  return ptr
}

function free(ptr: number): void {
  CanvasKitApi.free(ptr >>> 0)
}

export class CanvasPtr extends Ptr {
  constructor(ptr?: number) {
    // Non-owning pointer (owned by Surface).
    super(ptr ?? -1)
  }

  delete(): void {
    // Canvas is owned by Surface; do not delete wasm-side.
    this.ptr = -1
  }

  deleteLater(): void {
    // Non-owning.
    this.ptr = -1
  }

  clone(): CanvasPtr {
    return new CanvasPtr(this.ptr)
  }

  isAliasOf(other: any): boolean {
    return other instanceof CanvasPtr && this.ptr === other.ptr
  }

  isDeleted(): boolean {
    return this.ptr === -1
  }
}

export class Canvas extends ManagedObj {
  constructor(ptr: CanvasPtr) {
    super(ptr)
  }

  resurrect(): Ptr {
    throw new Error('Canvas cannot be resurrected')
  }

  get raw(): CanvasPtr {
    return this.ptr as unknown as CanvasPtr
  }

  clear(argb: number): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    CanvasKitApi.Canvas.clear(this.raw.ptr, argb >>> 0)
    return this
  }

  save(): number {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    return CanvasKitApi.Canvas.save(this.raw.ptr)
  }

  restore(): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    CanvasKitApi.Canvas.restore(this.raw.ptr)
    return this
  }

  translate(dx: number, dy: number): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    CanvasKitApi.Canvas.translate(this.raw.ptr, dx, dy)
    return this
  }

  scale(sx: number, sy: number): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    CanvasKitApi.Canvas.scale(this.raw.ptr, sx, sy)
    return this
  }

  rotate(degrees: number): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    CanvasKitApi.Canvas.rotate(this.raw.ptr, degrees)
    return this
  }

  concat(m9: ArrayLike<number>): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    invariant(m9.length === 9, `concat: expected 9 floats, got ${m9.length}`)

    const mPtr = allocF32Array(m9)
    try {
      CanvasKitApi.Canvas.concat(this.raw.ptr, mPtr)
    } finally {
      free(mPtr)
    }

    return this
  }

  setMatrix(m9: ArrayLike<number>): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    invariant(m9.length === 9, `setMatrix: expected 9 floats, got ${m9.length}`)

    const mPtr = allocF32Array(m9)
    try {
      CanvasKitApi.Canvas.setMatrix(this.raw.ptr, mPtr)
    } finally {
      free(mPtr)
    }

    return this
  }

  clipRect(rect: Rect | [number, number, number, number], clipOp: ClipOp, doAA: boolean): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    const [l, t, r, b] = rect instanceof Rect ? rect.toLTRB() : rect
    CanvasKitApi.Canvas.clipRect(this.raw.ptr, l, t, r, b, clipOp, doAA)
    return this
  }

  drawRect(rect: Rect | [number, number, number, number], paint: Paint): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    const [l, t, r, b] = rect instanceof Rect ? rect.toLTRB() : rect
    const paintPtr = (paint as any).ptr.ptr
    CanvasKitApi.Canvas.drawRect(this.raw.ptr, l, t, r, b, paintPtr)
    return this
  }

  drawCircle(cx: number, cy: number, radius: number, paint: Paint): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    CanvasKitApi.Canvas.drawCircle(this.raw.ptr, cx, cy, radius, paint.raw.ptr)
    return this
  }

  drawLine(x0: number, y0: number, x1: number, y1: number, paint: Paint): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    CanvasKitApi.Canvas.drawLine(this.raw.ptr, x0, y0, x1, y1, paint.raw.ptr)
    return this
  }

  drawPath(path: Path, paint: Paint): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')

    CanvasKitApi.Canvas.drawPath(
      this.raw.ptr, 
      path.raw.ptr, 
      paint.raw.ptr)

    return this
  }

  drawImage(image: Image, x: number, y: number, filterMode: FilterMode, mipmapMode: MipmapMode): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    const imagePtr = (image as any).ptr.ptr
    CanvasKitApi.Canvas.drawImage(this.raw.ptr, image.raw.ptr, x, y, filterMode, mipmapMode)
    return this
  }

  drawImageWithPaint(image: Image, x: number, y: number, paint?: ImagePaint | Paint | null): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')

    const filterMode = paint && !(paint instanceof Paint) ? ((paint as ImagePaint).filterMode ?? FilterMode.Linear) : FilterMode.Linear
    const mipmapMode = paint && !(paint instanceof Paint) ? ((paint as ImagePaint).mipmapMode ?? MipmapMode.None) : MipmapMode.None

    const opacity = paint && !(paint instanceof Paint) ? +((paint as ImagePaint).opacity ?? 1) : 1
    if (!(opacity > 0)) {
      return this
    }

    if (opacity >= 1) {
      return this.drawImage(image, x, y, filterMode, mipmapMode)
    }

    const paintPtr = CanvasKitApi.Paint.make()
    try {
      CanvasKitApi.Paint.setAlphaf(paintPtr, opacity)
      CanvasKitApi.Canvas.drawImageWithPaint(this.raw.ptr, image.raw.ptr, x, y, filterMode, mipmapMode, paintPtr)
    } finally {
      CanvasKitApi.Paint.delete(paintPtr)
    }

    return this
  }

  drawImageRect(image: Image, src: Rect | LTRBRect, dst: Rect | LTRBRect, paint?: ImagePaint | Paint | null): this
  drawImageRect(image: Image, src: Rect | LTRBRect, dst: Rect | LTRBRect, filterMode: FilterMode, mipmapMode: MipmapMode): this
  drawImageRect(
    image: Image,
    src: Rect | LTRBRect,
    dst: Rect | LTRBRect,
    paintOrFilterMode?: ImagePaint | Paint | FilterMode | null,
    mipmapMode?: MipmapMode,
  ): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    const [srcL, srcT, srcR, srcB] = src instanceof Rect ? src.toLTRB() : src
    const [dstL, dstT, dstR, dstB] = dst instanceof Rect ? dst.toLTRB() : dst

    // Low-level call path (explicit sampling)
    if (typeof paintOrFilterMode === 'number') {
      CanvasKitApi.Canvas.drawImageRect(
        this.raw.ptr,
        image.raw.ptr,
        srcL,
        srcT,
        srcR,
        srcB,
        dstL,
        dstT,
        dstR,
        dstB,
        paintOrFilterMode as FilterMode,
        (mipmapMode ?? MipmapMode.None) as MipmapMode,
      )
      return this
    }

    // Painting-style call path: paint is a lightweight object with opacity.
    const paint = paintOrFilterMode as ImagePaint | Paint | null | undefined
    if (paint instanceof Paint) {
      // Allow callers to pass a real SkPaint.
      CanvasKitApi.Canvas.drawImageRectWithPaint(
        this.raw.ptr,
        image.raw.ptr,
        srcL,
        srcT,
        srcR,
        srcB,
        dstL,
        dstT,
        dstR,
        dstB,
        FilterMode.Linear,
        MipmapMode.None,
        paint.raw.ptr,
      )
      return this
    }

    const opacity = +((paint?.opacity ?? 1) as number)
    const filterMode = (paint?.filterMode ?? FilterMode.Linear) as FilterMode
    const mipmapMode2 = (paint?.mipmapMode ?? MipmapMode.None) as MipmapMode
    if (!(opacity > 0)) {
      return this
    }

    if (opacity >= 1) {
      CanvasKitApi.Canvas.drawImageRect(
        this.raw.ptr,
        image.raw.ptr,
        srcL,
        srcT,
        srcR,
        srcB,
        dstL,
        dstT,
        dstR,
        dstB,
        filterMode,
        mipmapMode2,
      )
      return this
    }

    const paintPtr = CanvasKitApi.Paint.make()
    try {
      CanvasKitApi.Paint.setAlphaf(paintPtr, opacity)
      CanvasKitApi.Canvas.drawImageRectWithPaint(
        this.raw.ptr,
        image.raw.ptr,
        srcL,
        srcT,
        srcR,
        srcB,
        dstL,
        dstT,
        dstR,
        dstB,
        filterMode,
        mipmapMode2,
        paintPtr,
      )
    } finally {
      CanvasKitApi.Paint.delete(paintPtr)
    }

    return this
  }

  drawImageNine(image: Image, center: LTRBRect, dst: LTRBRect, paint?: ImagePaint | Paint | null): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')

    const imgW = image.width
    const imgH = image.height

    const [cL, cT, cR, cB] = center
    const [dL, dT, dR, dB] = dst

    const dstW = dR - dL
    const dstH = dB - dT
    if (!(dstW > 0) || !(dstH > 0)) return this

    const leftW = Math.max(0, cL)
    const rightW = Math.max(0, imgW - cR)
    const topH = Math.max(0, cT)
    const bottomH = Math.max(0, imgH - cB)

    const dstLeftW = Math.min(leftW, dstW)
    const dstRightW = Math.min(rightW, Math.max(0, dstW - dstLeftW))
    const dstMidW = Math.max(0, dstW - dstLeftW - dstRightW)

    const dstTopH = Math.min(topH, dstH)
    const dstBottomH = Math.min(bottomH, Math.max(0, dstH - dstTopH))
    const dstMidH = Math.max(0, dstH - dstTopH - dstBottomH)

    const x0s = 0
    const x1s = cL
    const x2s = cR
    const x3s = imgW

    const y0s = 0
    const y1s = cT
    const y2s = cB
    const y3s = imgH

    const x0d = dL
    const x1d = dL + dstLeftW
    const x2d = x1d + dstMidW
    const x3d = dR

    const y0d = dT
    const y1d = dT + dstTopH
    const y2d = y1d + dstMidH
    const y3d = dB

    const drawPatch = (sx0: number, sy0: number, sx1: number, sy1: number, dx0: number, dy0: number, dx1: number, dy1: number) => {
      if (!(sx1 > sx0) || !(sy1 > sy0) || !(dx1 > dx0) || !(dy1 > dy0)) return
      this.drawImageRect(image, [sx0, sy0, sx1, sy1], [dx0, dy0, dx1, dy1], paint as any)
    }

    // top row
    drawPatch(x0s, y0s, x1s, y1s, x0d, y0d, x1d, y1d)
    drawPatch(x1s, y0s, x2s, y1s, x1d, y0d, x2d, y1d)
    drawPatch(x2s, y0s, x3s, y1s, x2d, y0d, x3d, y1d)

    // middle row
    drawPatch(x0s, y1s, x1s, y2s, x0d, y1d, x1d, y2d)
    drawPatch(x1s, y1s, x2s, y2s, x1d, y1d, x2d, y2d)
    drawPatch(x2s, y1s, x3s, y2s, x2d, y1d, x3d, y2d)

    // bottom row
    drawPatch(x0s, y2s, x1s, y3s, x0d, y2d, x1d, y3d)
    drawPatch(x1s, y2s, x2s, y3s, x1d, y2d, x2d, y3d)
    drawPatch(x2s, y2s, x3s, y3s, x2d, y2d, x3d, y3d)

    return this
  }

  drawTextBlob(blob: number, x: number, y: number, paint: Paint): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    CanvasKitApi.Canvas.drawTextBlob(this.raw.ptr, blob, x, y, paint.raw.ptr)
    return this
  }

  drawParagraph(paragraph: number, x: number, y: number): this {
    invariant(!this.raw.isDeleted(), 'Canvas is deleted')
    CanvasKitApi.Canvas.drawParagraph(this.raw.ptr, paragraph, x, y)
    return this
  }
}
