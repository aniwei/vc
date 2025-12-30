import invariant from 'invariant'

import { Rect } from 'geometry'
import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'
import type { PathFillType } from './enums'


class PathPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? CanvasKitApi.Path.make())
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Path.delete(this.raw)
      this.raw = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): PathPtr {
    // Alias semantics: this does NOT deep-copy.
    return new PathPtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof PathPtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
  }

  setFillType(fillType: PathFillType): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.setFillType(this.raw, fillType)
  }

  moveTo(x: number, y: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.moveTo(this.raw, x, y)
  }

  lineTo(x: number, y: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.lineTo(this.raw, x, y)
  }

  quadTo(x1: number, y1: number, x2: number, y2: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.quadTo(this.raw, x1, y1, x2, y2)
  }

  cubicTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.cubicTo(this.raw, x1, y1, x2, y2, x3, y3)
  }

  close(): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.close(this.raw)
  }

  reset(): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.reset(this.raw)
  }

  getBounds(): Rect {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    invariant(CanvasKitApi.Path.hasExport('Path_getBounds'), 'CanvasKit wasm missing Path_getBounds; rebuild canvaskit.wasm')


    const outPtr = CanvasKitApi.malloc(4 * 4) as number
    CanvasKitApi.setFloat32Array(outPtr >>> 0, [0, 0, 0, 0])
    
    try {
      CanvasKitApi.Path.getBounds(this.raw, outPtr)
      const r = CanvasKitApi.getFloat32Array(outPtr >>> 0, 4)
      return Rect.fromLTRB(r[0]!, r[1]!, r[2]!, r[3]!)
    } finally {
      CanvasKitApi.free(outPtr >>> 0)
    }
  }

  addRect(rect: Rect | [number, number, number, number]): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    const [l, t, r, b] = rect instanceof Rect ? rect.toLTRB() : rect
    CanvasKitApi.Path.addRect(this.raw, l, t, r, b)
  }

  addCircle(cx: number, cy: number, r: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.addCircle(this.raw, cx, cy, r)
  }

  addOval(rect: Rect | [number, number, number, number], dir: number = 0, startIndex: number = 0): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    const [l, t, r, b] = rect instanceof Rect ? rect.toLTRB() : rect
    CanvasKitApi.Path.addOval(this.raw, l, t, r, b, dir | 0, startIndex | 0)
  }

  addRRectXY(
    rect: Rect | [number, number, number, number],
    rx: number,
    ry: number,
    dir: number = 0,
    startIndex: number = 0
  ): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    const [l, t, r, b] = rect instanceof Rect ? rect.toLTRB() : rect
    CanvasKitApi.Path.addRRectXY(this.raw, l, t, r, b, rx, ry, dir | 0, startIndex | 0)
  }

  addPolygon(pointsXY: ArrayLike<number>, pointCount: number, close: boolean): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    invariant(pointCount > 0, 'addPolygon: pointCount must be > 0')
    invariant(pointsXY.length >= pointCount * 2, 'addPolygon: pointsXY length insufficient')

    const pointsPtr = CanvasKitApi.malloc(pointCount * 2 * 4) as number
    CanvasKitApi.setFloat32Array(pointsPtr >>> 0, pointsXY)

    try {
      CanvasKitApi.Path.addPolygon(this.raw, pointsPtr, pointCount | 0, close)
    } finally {
      CanvasKitApi.free(pointsPtr >>> 0)
    }
  }

  addArc(oval: Rect | [number, number, number, number], startAngleDeg: number, sweepAngleDeg: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    const [l, t, r, b] = oval instanceof Rect ? oval.toLTRB() : oval
    CanvasKitApi.Path.addArc(this.raw, l, t, r, b, startAngleDeg, sweepAngleDeg)
  }

  arcToOval(
    oval: Rect | [number, number, number, number],
    startAngleDeg: number,
    sweepAngleDeg: number,
    forceMoveTo: boolean
  ): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    const [l, t, r, b] = oval instanceof Rect ? oval.toLTRB() : oval
    CanvasKitApi.Path.arcToOval(this.raw, l, t, r, b, startAngleDeg, sweepAngleDeg, forceMoveTo)
  }

  snapshot(): number {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    return CanvasKitApi.Path.snapshot(this.raw)
  }
}

type PathKind = 'builder' | 'snapshot'

class SnapshotPathPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Path.deleteSkPath(this.raw)
      this.raw = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): SnapshotPathPtr {
    return new SnapshotPathPtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof SnapshotPathPtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
  }

  transform(m9: ArrayLike<number>): void {
    invariant(!this.isDeleted(), 'Path snapshot is deleted')
    invariant(m9.length === 9, `transform: expected 9 floats, got ${m9.length}`)

    // TODO
    const mPtr = CanvasKitApi.malloc(9 * 4) as number
    CanvasKitApi.setFloat32Array(mPtr >>> 0, m9)
    
    try {
      CanvasKitApi.Path.transform(this.raw, mPtr)
    } finally {
      CanvasKitApi.free(mPtr >>> 0)
    }
  }

  getBounds(): Rect {
    invariant(!this.isDeleted(), 'Path snapshot is deleted')
    invariant(CanvasKitApi.Path.hasExport('SkPath_getBounds'), 'CanvasKit wasm missing SkPath_getBounds; rebuild canvaskit.wasm')

    const outPtr = CanvasKitApi.malloc(4 * 4) as number
    CanvasKitApi.setFloat32Array(outPtr >>> 0, [0, 0, 0, 0])
    try {
      CanvasKitApi.Path.getSkPathBounds(this.raw, outPtr)
      const r = CanvasKitApi.getFloat32Array(outPtr >>> 0, 4)
      return Rect.fromLTRB(r[0]!, r[1]!, r[2]!, r[3]!)
    } finally {
      CanvasKitApi.free(outPtr >>> 0)
    }
  }
}

export class Path extends ManagedObj {
  #fillType: PathFillType = 0 as PathFillType
  #kind: PathKind

  constructor(kind: PathKind = 'builder', ptr?: Ptr) {
    super(ptr ?? (kind === 'builder' ? new PathPtr() : new SnapshotPathPtr(-1)))
    this.#kind = kind
  }

  resurrect(): Ptr {
    // NOTE: Path always passes an explicit Ptr into super(), so resurrect() is not used.
    // Keep this for base-class compatibility.
    return new PathPtr()
  }

  get ptr(): PathPtr {
    return super.ptr as PathPtr
  }

  get #rawSnapshot(): SnapshotPathPtr {
    invariant(this.#kind === 'snapshot', 'Path is a builder; snapshot operations are not allowed')
    return this.ptr as unknown as SnapshotPathPtr
  }

  set fillType(fillType: PathFillType) {
    if (this.#fillType !== fillType) {
      this.#fillType = fillType
      this.ptr.setFillType(fillType)
    }
  }

  get fillType(): PathFillType {
    return this.#fillType
  }

  getBounds(): Rect {
    if (this.#kind === 'builder') {
      return (this.ptr as unknown as PathPtr).getBounds()
    }
    return this.#rawSnapshot.getBounds()
  }

  moveTo(x: number, y: number): this {
    this.ptr.moveTo(x, y)
    return this
  }

  lineTo(x: number, y: number): this {
    this.ptr.lineTo(x, y)
    return this
  }

  quadTo(x1: number, y1: number, x2: number, y2: number): this {
    this.ptr.quadTo(x1, y1, x2, y2)
    return this
  }

  cubicTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): this {
    this.ptr.cubicTo(x1, y1, x2, y2, x3, y3)
    return this
  }

  close(): this {
    this.ptr.close()
    return this
  }

  reset(): this {
    this.ptr.reset()
    return this
  }

  addRect(rect: Rect | [number, number, number, number]): this {
    this.ptr.addRect(rect)
    return this
  }

  addCircle(cx: number, cy: number, r: number): this {
    this.ptr.addCircle(cx, cy, r)
    return this
  }

  addOval(rect: Rect | [number, number, number, number], dir: number = 0, startIndex: number = 0): this {
    this.ptr.addOval(rect, dir, startIndex)
    return this
  }

  addRRectXY(
    rect: Rect | [number, number, number, number],
    rx: number,
    ry: number,
    dir: number = 0,
    startIndex: number = 0
  ): this {
    this.ptr.addRRectXY(rect, rx, ry, dir, startIndex)
    return this
  }

  addPolygon(pointsXY: ArrayLike<number>, pointCount: number, close: boolean): this {
    this.ptr.addPolygon(pointsXY, pointCount, close)
    return this
  }

  addArc(oval: Rect | [number, number, number, number], startAngleDeg: number, sweepAngleDeg: number): this {
    this.ptr.addArc(oval, startAngleDeg, sweepAngleDeg)
    return this
  }

  arcToOval(
    oval: Rect | [number, number, number, number],
    startAngleDeg: number,
    sweepAngleDeg: number,
    forceMoveTo: boolean
  ): this {
    this.ptr.arcToOval(oval, startAngleDeg, sweepAngleDeg, forceMoveTo)
    return this
  }

  snapshot(): Path {
    const skPathPtr = this.ptr.snapshot()
    return new Path('snapshot', new SnapshotPathPtr(skPathPtr))
  }

  transform(m9: ArrayLike<number>): this {
    this.#rawSnapshot.transform(m9)
    return this
  }

  dispose(): void {
    if (this.#kind === 'builder') {
      ;(this.ptr as unknown as PathPtr).deleteLater()
    } else {
      ;(this.ptr as unknown as SnapshotPathPtr).deleteLater()
    }
    super.dispose()
  }
}
