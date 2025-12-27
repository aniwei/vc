import type { Ptr } from '../types'
import { Api } from './Api'

export class Paint extends Api {
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

  setStyle(paint: Ptr, style: number): void {
    this.invoke('Paint_setStyle', paint, style | 0)
  }

  setStrokeWidth(paint: Ptr, width: number): void {
    this.invoke('Paint_setStrokeWidth', paint, +width)
  }

  setShader(paint: Ptr, shader: Ptr): void {
    this.invoke('Paint_setShader', paint, shader)
  }
}
