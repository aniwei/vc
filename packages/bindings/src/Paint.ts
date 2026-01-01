import invariant from 'invariant'

import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'
import { BlendMode, PaintStyle } from './enums'
import type { StrokeCap, StrokeJoin } from './enums'
import { SharePaint } from './SharePaint'

export class PaintPtr extends Ptr {
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

  setStrokeMiter(miterLimit: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setStrokeMiter(this.raw, miterLimit)
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

  setImageFilter(imageFilter: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setImageFilter(this.raw, imageFilter)
  }

  setMaskFilter(maskFilter: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setMaskFilter(this.raw, maskFilter)
  }

  setPathEffect(pathEffect: number): void {
    invariant(!this.isDeleted(), 'PaintPtr is deleted')
    CanvasKitApi.Paint.setPathEffect(this.raw, pathEffect)
  }
}

export class Paint extends SharePaint { 
  #blendMode: BlendMode | null = null;
  get blendMode(): BlendMode | null {
    return this.#blendMode;
  }
  set blendMode(value: BlendMode | null) {
    if (this.#blendMode !== value) {
      this.#blendMode = value;
      this.setBlendMode(value ?? BlendMode.SrcOver);
    }
  }

}
