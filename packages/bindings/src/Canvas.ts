import invariant from 'invariant'
import { RRect, Rect } from 'geometry'
import { ManagedObj, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'

import { FilterMode, MipmapMode } from './enums'
import { Paint } from './Paint'
import { Paragraph } from './Paragraph'

import type { ClipOp } from './enums'
import type { Path } from './Path'
import type { Image } from './Image'

type LTRBRect = readonly [number, number, number, number]

export interface ImagePaint {
  opacity?: number
  filterMode?: FilterMode
  mipmapMode?: MipmapMode
}

export class CanvasPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  delete(): void {
    this.raw = -1
  }

  deleteLater(): void {
    this.raw = -1
  }

  clone(): CanvasPtr {
    return new CanvasPtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof CanvasPtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
  }

  get count(): number {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    return CanvasKitApi.Canvas.getSaveCount(this.raw) | 0
  }

  clear(argb: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.clear(this.raw, argb >>> 0)
  }

  save(): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.save(this.raw)
  }

  saveLayer(l: number, t: number, r: number, b: number, hasBounds: boolean, paintPtr: number | null): number {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    return CanvasKitApi.Canvas.saveLayer(this.raw, l, t, r, b, hasBounds, (paintPtr ?? 0) >>> 0) | 0
  }

  restore(): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.restore(this.raw)
  }

  restoreToCount(count: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.restoreToCount(this.raw, count | 0)
  }

  translate(dx: number, dy: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.translate(this.raw, dx, dy)
  }

  scale(sx: number, sy: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.scale(this.raw, sx, sy)
  }

  rotate(degrees: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.rotate(this.raw, degrees)
  }

  clipRect(l: number, t: number, r: number, b: number, clipOp: ClipOp, doAA: boolean): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.clipRect(this.raw, l, t, r, b, clipOp, doAA)
  }

  drawRect(l: number, t: number, r: number, b: number, paintPtr: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.drawRect(this.raw, l, t, r, b, paintPtr)
  }

  drawCircle(cx: number, cy: number, radius: number, paintPtr: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.drawCircle(this.raw, cx, cy, radius, paintPtr)
  }

  drawColor(): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    
  }

  drawLine(x0: number, y0: number, x1: number, y1: number, paintPtr: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.drawLine(this.raw, x0, y0, x1, y1, paintPtr)
  }

  drawPath(path: number, paintPtr: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')

    CanvasKitApi.Canvas.drawPath(this.raw, path, paintPtr)
  }

  drawOval(l: number, t: number, r: number, b: number, paintPtr: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.drawOval(this.raw, l, t, r, b, paintPtr)
  }

  drawArc(
    l: number,
    t: number,
    r: number,
    b: number,
    startAngle: number,
    sweepAngle: number,
    useCenter: boolean,
    paintPtr: number,
  ): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.drawArc(this.raw, l, t, r, b, startAngle, sweepAngle, useCenter, paintPtr)
  }

  drawPaint(paintPtr: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.drawPaint(this.raw, paintPtr)
  }

  drawImage(imagePtr: number, x: number, y: number, filterMode: FilterMode, mipmapMode: MipmapMode): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.drawImage(this.raw, imagePtr, x, y, filterMode, mipmapMode)
  }

  drawImageWithPaint(imagePtr: number, x: number, y: number, paintPtr: number | null): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    
  }

  drawTextBlob(blobPtr: number, x: number, y: number, paintPtr: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.drawTextBlob(this.raw, blobPtr, x, y, paintPtr)
  }

  drawParagraph(paragraphPtr: number, x: number, y: number): void {
    invariant(!this.isDeleted(), 'CanvasPtr is deleted')
    CanvasKitApi.Canvas.drawParagraph(this.raw, paragraphPtr, x, y)
  }
}

export class Canvas extends ManagedObj {
  constructor(ptr: CanvasPtr) {
    super(ptr)
  }

  get ptr(): CanvasPtr {
    return super.ptr as CanvasPtr
  }

  get count(): number {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    return this.ptr.count
  }

  getSaveCount(): number {
    return this.count
  }

  resurrect(): Ptr {
    throw new Error('Canvas cannot be resurrected')
  }

  clear(argb: number): this {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.clear(argb >>> 0)
    return this
  }

  save() {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.save()
  }

  saveLayer(): number
  saveLayer(bounds: Rect | LTRBRect | null, paint?: Paint | null): number
  saveLayer(bounds?: Rect | LTRBRect | null, paint: Paint | null = null): number {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    const hasBounds = !!bounds
    const isRect = bounds instanceof Rect
    const l = hasBounds ? (isRect ? bounds.left : bounds![0]) : 0
    const t = hasBounds ? (isRect ? bounds.top : bounds![1]) : 0
    const r = hasBounds ? (isRect ? bounds.right : bounds![2]) : 0
    const b = hasBounds ? (isRect ? bounds.bottom : bounds![3]) : 0
    return this.ptr.saveLayer(l, t, r, b, hasBounds, paint?.raw ?? 0)
  }

  saveLayerWithFilter(paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    
  }

  restore() {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.restore()
  }

  restoreToCount (count: number) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.restoreToCount(count)
  }

  translate(dx: number, dy: number) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.translate(dx, dy)
  }

  scale(sx: number, sy: number) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.scale(sx, sy)
  }

  rotate(degrees: number) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.rotate(degrees)
  }

  clipRect(rect: Rect | [number, number, number, number], clipOp: ClipOp, doAA: boolean) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.clipRect(
      rect instanceof Rect ? rect.left : rect[0],
      rect instanceof Rect ? rect.top : rect[1],
      rect instanceof Rect ? rect.right : rect[2],
      rect instanceof Rect ? rect.bottom : rect[3],
      clipOp,
      doAA)
  }

  clipRRect(rrect: RRect, clipOp: ClipOp, doAA: boolean) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    
  }

  clipPath(path: Path, doAA: boolean) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    
  }

  drawRect(rect: Rect | [number, number, number, number], paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    const isRect = rect instanceof Rect

    this.ptr.drawRect(
      isRect ? rect.left : rect[0],
      isRect ? rect.top : rect[1],
      isRect ? rect.right : rect[2],
      isRect ? rect.bottom : rect[3],
      paint.raw)
  }

  drawRRect(rrect: RRect, paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    
  }

  drawDRRect(outer: RRect, inner:RRect, paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
  }

  drawImage(image: Image, x: number, y: number, filterMode: FilterMode, mipmapMode: MipmapMode) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.drawImage(image.raw, x, y, filterMode, mipmapMode)
  }

  drawImageRect(image: Image, src: Rect | LTRBRect, dst: Rect | LTRBRect, paintOrFilterMode?: ImagePaint | Paint | FilterMode | null, mipmapMode?: MipmapMode): void {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
   
  }

  drawImageNine(image: Image, center: LTRBRect, dst: LTRBRect, paint?: ImagePaint | Paint | null) {

  }

  drawCircle(cx: number, cy: number, radius: number, paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.drawCircle(cx, cy, radius, paint.ptr.raw)
  }

  drawLine(x0: number, y0: number, x1: number, y1: number, paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.drawLine(x0, y0, x1, y1, paint.ptr.raw)
  }

  drawPath(path: Path, paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.drawPath(path.ptr.raw, paint.ptr.raw)
  }

  drawOval(rect: Rect, paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.drawOval(rect.left, rect.top, rect.right, rect.bottom, paint.ptr.raw)
  }

  drawArc(rect: Rect, startAngle: number, sweepAngle: number, useCenter: boolean, paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.drawArc(rect.left, rect.top, rect.right, rect.bottom, startAngle, sweepAngle, useCenter, paint.ptr.raw)
  }

  drawPaint(paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    this.ptr.drawPaint(paint.raw)
  }

  drawTextBlob(blob: number, x: number, y: number, paint: Paint) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    
  }

  drawParagraph(paragraph: Paragraph, x: number, y: number) {
    invariant(!this.ptr.isDeleted(), 'Canvas is deleted')
    

  }
}
