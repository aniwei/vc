import type { Ptr } from '../types'
import { Api } from './Api'
import type { PathFillType } from '../enums'

export class PathApi extends Api {
  make(): Ptr {
    return this.invoke('MakePath')
  }

  delete(ptr: Ptr): void {
    this.invoke('DeletePath', ptr)
  }

  setFillType(ptr: Ptr, fillType: PathFillType): void {
    this.invoke('Path_setFillType', ptr, fillType | 0)
  }

  moveTo(ptr: Ptr, x: number, y: number): void {
    this.invoke('Path_moveTo', ptr, +x, +y)
  }

  lineTo(ptr: Ptr, x: number, y: number): void {
    this.invoke('Path_lineTo', ptr, +x, +y)
  }

  close(ptr: Ptr): void {
    this.invoke('Path_close', ptr)
  }

  reset(ptr: Ptr): void {
    this.invoke('Path_reset', ptr)
  }

  getBounds(ptr: Ptr, outLTRB4Ptr: Ptr): void {
    this.invoke('Path_getBounds', ptr, outLTRB4Ptr >>> 0)
  }

  quadTo(ptr: Ptr, x1: number, y1: number, x2: number, y2: number): void {
    this.invoke('Path_quadTo', ptr, +x1, +y1, +x2, +y2)
  }

  cubicTo(ptr: Ptr, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
    this.invoke('Path_cubicTo', ptr, +x1, +y1, +x2, +y2, +x3, +y3)
  }

  addRect(ptr: Ptr, l: number, t: number, r: number, b: number): void {
    this.invoke('Path_addRect', ptr, +l, +t, +r, +b)
  }

  addCircle(ptr: Ptr, cx: number, cy: number, r: number): void {
    this.invoke('Path_addCircle', ptr, +cx, +cy, +r)
  }

  addOval(ptr: Ptr, l: number, t: number, r: number, b: number, dir: number, startIndex: number): void {
    this.invoke('Path_addOval', ptr, +l, +t, +r, +b, dir | 0, startIndex | 0)
  }

  addRRectXY(
    ptr: Ptr,
    l: number,
    t: number,
    r: number,
    b: number,
    rx: number,
    ry: number,
    dir: number,
    startIndex: number
  ): void {
    this.invoke('Path_addRRectXY', ptr, +l, +t, +r, +b, +rx, +ry, dir | 0, startIndex | 0)
  }

  addPolygon(ptr: Ptr, pointsXYPtr: Ptr, pointCount: number, close: boolean): void {
    this.invoke('Path_addPolygon', ptr, pointsXYPtr >>> 0, pointCount | 0, close ? 1 : 0)
  }

  addArc(ptr: Ptr, l: number, t: number, r: number, b: number, startAngleDeg: number, sweepAngleDeg: number): void {
    this.invoke('Path_addArc', ptr, +l, +t, +r, +b, +startAngleDeg, +sweepAngleDeg)
  }

  arcToOval(
    ptr: Ptr,
    l: number,
    t: number,
    r: number,
    b: number,
    startAngleDeg: number,
    sweepAngleDeg: number,
    forceMoveTo: boolean
  ): void {
    this.invoke('Path_arcToOval', ptr, +l, +t, +r, +b, +startAngleDeg, +sweepAngleDeg, forceMoveTo ? 1 : 0)
  }

  snapshot(ptr: Ptr): Ptr {
    return this.invoke('Path_snapshot', ptr)
  }

  deleteSkPath(skPath: Ptr): void {
    this.invoke('DeleteSkPath', skPath)
  }

  transform(skPath: Ptr, m9Ptr: Ptr): void {
    this.invoke('Path_transform', skPath, m9Ptr >>> 0)
  }

  getSkPathBounds(skPath: Ptr, outLTRB4Ptr: Ptr): void {
    this.invoke('SkPath_getBounds', skPath, outLTRB4Ptr >>> 0)
  }
}
