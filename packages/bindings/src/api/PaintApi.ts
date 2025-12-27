import type { Ptr } from '../types'
import { Api } from './Api'
import type { PaintStyle } from '../enums'

export enum StrokeCap {
  Butt = 0,
  Round = 1,
  Square = 2,
}

export enum StrokeJoin {
  Miter = 0,
  Round = 1,
  Bevel = 2,
}

export class PaintApi extends Api {
  make(): Ptr {
    return this.invoke('MakePaint')
  }

  delete(paint: Ptr): void {
    this.invoke('DeletePaint', paint)
  }

  setColor(paint: Ptr, argb: number): void {
    this.invoke('Paint_setColor', paint, argb >>> 0)
  }

  setAntiAlias(paint: Ptr, aa: boolean): void {
    this.invoke('Paint_setAntiAlias', paint, aa ? 1 : 0)
  }

  setStyle(paint: Ptr, style: PaintStyle): void {
    this.invoke('Paint_setStyle', paint, style | 0)
  }

  setStrokeWidth(paint: Ptr, width: number): void {
    this.invoke('Paint_setStrokeWidth', paint, +width)
  }

  setStrokeCap(paint: Ptr, cap: StrokeCap): void {
    this.invoke('Paint_setStrokeCap', paint, cap | 0)
  }

  setStrokeJoin(paint: Ptr, join: StrokeJoin): void {
    this.invoke('Paint_setStrokeJoin', paint, join | 0)
  }

  setAlphaf(paint: Ptr, a: number): void {
    this.invoke('Paint_setAlphaf', paint, +a)
  }

  setBlendMode(paint: Ptr, mode: number): void {
    this.invoke('Paint_setBlendMode', paint, mode | 0)
  }

  setShader(paint: Ptr, shader: Ptr): void {
    this.invoke('Paint_setShader', paint, shader)
  }

  setColorFilter(paint: Ptr, colorFilter: Ptr): void {
    this.invoke('Paint_setColorFilter', paint, colorFilter)
  }
}
