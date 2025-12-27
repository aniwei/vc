import invariant from 'invariant'

import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'
import { Rect } from './Geometry'
import type { PathFillType } from './enums'

function getHeapU8(): Uint8Array {
  return CanvasKitApi.heapU8()
}

function writeF32Array(ptr: number, values: ArrayLike<number>): void {
  const heap = getHeapU8()
  const f32 = new Float32Array(heap.buffer)
  const off = (ptr >>> 0) >>> 2
  for (let i = 0; i < values.length; i++) {
    f32[off + i] = +values[i]
  }
}

function allocF32Array(values: ArrayLike<number>): number {
  const ptr = CanvasKitApi.malloc(values.length * 4) as number
  writeF32Array(ptr, values)
  return ptr
}

function free(ptr: number): void {
  CanvasKitApi.free(ptr >>> 0)
}

class PathPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? CanvasKitApi.Path.make())
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Path.delete(this.ptr)
      this.ptr = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): PathPtr {
    // Alias semantics: this does NOT deep-copy.
    return new PathPtr(this.ptr)
  }

  isAliasOf(other: any): boolean {
    return other instanceof PathPtr && this.ptr === other.ptr
  }

  isDeleted(): boolean {
    return this.ptr === -1
  }

  setFillType(fillType: PathFillType): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.setFillType(this.ptr, fillType)
  }

  moveTo(x: number, y: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.moveTo(this.ptr, x, y)
  }

  lineTo(x: number, y: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.lineTo(this.ptr, x, y)
  }

  quadTo(x1: number, y1: number, x2: number, y2: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.quadTo(this.ptr, x1, y1, x2, y2)
  }

  cubicTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.cubicTo(this.ptr, x1, y1, x2, y2, x3, y3)
  }

  close(): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.close(this.ptr)
  }

  reset(): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.reset(this.ptr)
  }

  addRect(rect: Rect | [number, number, number, number]): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    const [l, t, r, b] = rect instanceof Rect ? rect.toLTRB() : rect
    CanvasKitApi.Path.addRect(this.ptr, l, t, r, b)
  }

  addCircle(cx: number, cy: number, r: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    CanvasKitApi.Path.addCircle(this.ptr, cx, cy, r)
  }

  addOval(rect: Rect | [number, number, number, number], dir: number = 0, startIndex: number = 0): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    const [l, t, r, b] = rect instanceof Rect ? rect.toLTRB() : rect
    CanvasKitApi.Path.addOval(this.ptr, l, t, r, b, dir | 0, startIndex | 0)
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
    CanvasKitApi.Path.addRRectXY(this.ptr, l, t, r, b, rx, ry, dir | 0, startIndex | 0)
  }

  addPolygon(pointsXY: ArrayLike<number>, pointCount: number, close: boolean): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    invariant(pointCount > 0, 'addPolygon: pointCount must be > 0')
    invariant(pointsXY.length >= pointCount * 2, 'addPolygon: pointsXY length insufficient')

    const pointsPtr = allocF32Array(pointsXY)
    try {
      CanvasKitApi.Path.addPolygon(this.ptr, pointsPtr, pointCount | 0, close)
    } finally {
      free(pointsPtr)
    }
  }

  addArc(oval: Rect | [number, number, number, number], startAngleDeg: number, sweepAngleDeg: number): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    const [l, t, r, b] = oval instanceof Rect ? oval.toLTRB() : oval
    CanvasKitApi.Path.addArc(this.ptr, l, t, r, b, startAngleDeg, sweepAngleDeg)
  }

  arcToOval(
    oval: Rect | [number, number, number, number],
    startAngleDeg: number,
    sweepAngleDeg: number,
    forceMoveTo: boolean
  ): void {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    const [l, t, r, b] = oval instanceof Rect ? oval.toLTRB() : oval
    CanvasKitApi.Path.arcToOval(this.ptr, l, t, r, b, startAngleDeg, sweepAngleDeg, forceMoveTo)
  }

  snapshot(): number {
    invariant(!this.isDeleted(), 'PathPtr is deleted')
    return CanvasKitApi.Path.snapshot(this.ptr)
  }
}

type PathKind = 'builder' | 'snapshot'

class SnapshotPathPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Path.deleteSkPath(this.ptr)
      this.ptr = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): SnapshotPathPtr {
    return new SnapshotPathPtr(this.ptr)
  }

  isAliasOf(other: any): boolean {
    return other instanceof SnapshotPathPtr && this.ptr === other.ptr
  }

  isDeleted(): boolean {
    return this.ptr === -1
  }

  transform(m9: ArrayLike<number>): void {
    invariant(!this.isDeleted(), 'Path snapshot is deleted')
    invariant(m9.length === 9, `transform: expected 9 floats, got ${m9.length}`)

    const mPtr = allocF32Array(m9)
    try {
      CanvasKitApi.Path.transform(this.ptr, mPtr)
    } finally {
      free(mPtr)
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

  get raw(): PathPtr {
    invariant(this.#kind === 'builder', 'Path is a snapshot; builder operations are not allowed')
    return this.ptr as unknown as PathPtr
  }

  get #rawSnapshot(): SnapshotPathPtr {
    invariant(this.#kind === 'snapshot', 'Path is a builder; snapshot operations are not allowed')
    return this.ptr as unknown as SnapshotPathPtr
  }

  set fillType(fillType: PathFillType) {
    if (this.#fillType !== fillType) {
      this.#fillType = fillType
      this.raw.setFillType(fillType)
    }
  }

  get fillType(): PathFillType {
    return this.#fillType
  }

  setFillType(fillType: PathFillType): this {
    this.fillType = fillType
    return this
  }

  moveTo(x: number, y: number): this {
    this.raw.moveTo(x, y)
    return this
  }

  lineTo(x: number, y: number): this {
    this.raw.lineTo(x, y)
    return this
  }

  quadTo(x1: number, y1: number, x2: number, y2: number): this {
    this.raw.quadTo(x1, y1, x2, y2)
    return this
  }

  cubicTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): this {
    this.raw.cubicTo(x1, y1, x2, y2, x3, y3)
    return this
  }

  close(): this {
    this.raw.close()
    return this
  }

  reset(): this {
    this.raw.reset()
    return this
  }

  addRect(rect: Rect | [number, number, number, number]): this {
    this.raw.addRect(rect)
    return this
  }

  addCircle(cx: number, cy: number, r: number): this {
    this.raw.addCircle(cx, cy, r)
    return this
  }

  addOval(rect: Rect | [number, number, number, number], dir: number = 0, startIndex: number = 0): this {
    this.raw.addOval(rect, dir, startIndex)
    return this
  }

  addRRectXY(
    rect: Rect | [number, number, number, number],
    rx: number,
    ry: number,
    dir: number = 0,
    startIndex: number = 0
  ): this {
    this.raw.addRRectXY(rect, rx, ry, dir, startIndex)
    return this
  }

  addPolygon(pointsXY: ArrayLike<number>, pointCount: number, close: boolean): this {
    this.raw.addPolygon(pointsXY, pointCount, close)
    return this
  }

  addArc(oval: Rect | [number, number, number, number], startAngleDeg: number, sweepAngleDeg: number): this {
    this.raw.addArc(oval, startAngleDeg, sweepAngleDeg)
    return this
  }

  arcToOval(
    oval: Rect | [number, number, number, number],
    startAngleDeg: number,
    sweepAngleDeg: number,
    forceMoveTo: boolean
  ): this {
    this.raw.arcToOval(oval, startAngleDeg, sweepAngleDeg, forceMoveTo)
    return this
  }

  snapshot(): Path {
    const skPathPtr = this.raw.snapshot()
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
