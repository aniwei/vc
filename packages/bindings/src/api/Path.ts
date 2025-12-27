import type { Ptr } from '../types'
import { Api } from './Api'

export class Path extends Api {
  make(): Ptr {
    return this.invoke('MakePath')
  }

  delete(pathPtr: Ptr): void {
    this.invoke('DeletePath', pathPtr)
  }

  moveTo(pathPtr: Ptr, x: number, y: number): void {
    this.invoke('Path_moveTo', pathPtr, +x, +y)
  }

  lineTo(pathPtr: Ptr, x: number, y: number): void {
    this.invoke('Path_lineTo', pathPtr, +x, +y)
  }

  addCircle(pathPtr: Ptr, cx: number, cy: number, r: number): void {
    this.invoke('Path_addCircle', pathPtr, +cx, +cy, +r)
  }

  snapshot(pathPtr: Ptr): Ptr {
    return this.invoke('Path_snapshot', pathPtr)
  }

  deleteSkPath(skPath: Ptr): void {
    this.invoke('DeleteSkPath', skPath)
  }

  transform(skPath: Ptr, m9Ptr: Ptr): void {
    this.invoke('Path_transform', skPath, m9Ptr >>> 0)
  }
}
