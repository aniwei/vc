import type { Ptr } from '../types'
import { Api } from './Api'

export class PathEffectApi extends Api {
  delete(pathEffect: Ptr): void {
    this.invoke('DeletePathEffect', pathEffect >>> 0)
  }

  makeDash(intervalsPtr: Ptr, count: number, phase: number): Ptr {
    return this.invoke('MakeDashPathEffect', intervalsPtr >>> 0, count | 0, +phase) as Ptr
  }
}