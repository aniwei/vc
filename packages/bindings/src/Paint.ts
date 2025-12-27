import invariant from 'invariant'

import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'
import type { PaintStyle } from './enums'
import type { StrokeCap, StrokeJoin } from './api/PaintApi'

class PaintPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? CanvasKitApi.Paint.make())
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Paint.delete(this.ptr)
      this.ptr = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): PaintPtr {
    return new PaintPtr(this.ptr)
  }

  isAliasOf(other: any): boolean {
    return other instanceof PaintPtr && this.ptr === other.ptr
  }

  isDeleted(): boolean {
    return this.ptr === -1
  }

  setColor(argb: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setColor(this.ptr, argb >>> 0)
  }

  setAntiAlias(aa: boolean): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setAntiAlias(this.ptr, aa)
  }

  setStyle(style: PaintStyle): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setStyle(this.ptr, style)
  }

  setStrokeWidth(width: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setStrokeWidth(this.ptr, +width)
  }

  setStrokeCap(cap: StrokeCap): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setStrokeCap(this.ptr, cap)
  }

  setStrokeJoin(join: StrokeJoin): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setStrokeJoin(this.ptr, join)
  }

  setAlphaf(a: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setAlphaf(this.ptr, +a)
  }

  setBlendMode(mode: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setBlendMode(this.ptr, mode | 0)
  }

  setShader(shader: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setShader(this.ptr, shader)
  }

  setColorFilter(colorFilter: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setColorFilter(this.ptr, colorFilter)
  }
}

export class Paint extends ManagedObj {
  constructor() {
    super(new PaintPtr())
  }

  resurrect(): Ptr {
    return new PaintPtr()
  }

  get raw(): PaintPtr {
    return this.ptr as unknown as PaintPtr
  }

  setColor(argb: number): this {
    this.raw.setColor(argb)
    return this
  }

  setAntiAlias(aa: boolean): this {
    this.raw.setAntiAlias(aa)
    return this
  }

  setStyle(style: PaintStyle): this {
    this.raw.setStyle(style)
    return this
  }

  setStrokeWidth(width: number): this {
    this.raw.setStrokeWidth(width)
    return this
  }

  setStrokeCap(cap: StrokeCap): this {
    this.raw.setStrokeCap(cap)
    return this
  }

  setStrokeJoin(join: StrokeJoin): this {
    this.raw.setStrokeJoin(join)
    return this
  }

  setAlphaf(a: number): this {
    this.raw.setAlphaf(a)
    return this
  }

  setBlendMode(mode: number): this {
    this.raw.setBlendMode(mode)
    return this
  }

  setShader(shader: number): this {
    this.raw.setShader(shader)
    return this
  }

  setColorFilter(colorFilter: number): this {
    this.raw.setColorFilter(colorFilter)
    return this
  }

  dispose(): void {
    ;(this.ptr as unknown as PaintPtr).deleteLater()
    super.dispose()
  }
}
