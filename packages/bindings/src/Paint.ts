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
      CanvasKitApi.Paint.delete(this.raw)
      this.raw = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): PaintPtr {
    return new PaintPtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof PaintPtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
  }

  setColor(argb: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setColor(this.raw, argb >>> 0)
  }

  setAntiAlias(aa: boolean): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setAntiAlias(this.raw, aa)
  }

  setStyle(style: PaintStyle): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setStyle(this.raw, style)
  }

  setStrokeWidth(width: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setStrokeWidth(this.raw, +width)
  }

  setStrokeCap(cap: StrokeCap): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setStrokeCap(this.raw, cap)
  }

  setStrokeJoin(join: StrokeJoin): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setStrokeJoin(this.raw, join)
  }

  setAlphaf(a: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setAlphaf(this.raw, +a)
  }

  setBlendMode(mode: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setBlendMode(this.raw, mode | 0)
  }

  setShader(shader: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setShader(this.raw, shader)
  }

  setColorFilter(colorFilter: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setColorFilter(this.raw, colorFilter)
  }

  setPathEffect(pathEffect: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setPathEffect(this.raw, pathEffect)
  }
}

export class Paint extends ManagedObj {
  constructor() {
    super(new PaintPtr())
  }

  get ptr(): PaintPtr {
    return super.ptr as PaintPtr
  }

  resurrect(): Ptr {
    return new PaintPtr()
  }

  setColor(argb: number): this {
    this.ptr.setColor(argb)
    return this
  }

  setAntiAlias(aa: boolean): this {
    this.ptr.setAntiAlias(aa)
    return this
  }

  setStyle(style: PaintStyle): this {
    this.ptr.setStyle(style)
    return this
  }

  setStrokeWidth(width: number): this {
    this.ptr.setStrokeWidth(width)
    return this
  }

  setStrokeCap(cap: StrokeCap): this {
    this.ptr.setStrokeCap(cap)
    return this
  }

  setStrokeJoin(join: StrokeJoin): this {
    this.ptr.setStrokeJoin(join)
    return this
  }

  setAlphaf(a: number): this {
    this.ptr.setAlphaf(a)
    return this
  }

  setBlendMode(mode: number): this {
    this.ptr.setBlendMode(mode)
    return this
  }

  setShader(shader: number): this {
    this.ptr.setShader(shader)
    return this
  }

  setColorFilter(colorFilter: number): this {
    this.ptr.setColorFilter(colorFilter)
    return this
  }

  setPathEffect(pathEffect: number): this {
    this.ptr.setPathEffect(pathEffect)
    return this
  }

  dispose(): void {
    this.ptr.deleteLater()
    super.dispose()
  }
}
