import invariant from 'invariant'

import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'

class PathPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? CanvasKitApi.Path.make())
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Path.delete(this.ptr)
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): PathPtr {
    return new PathPtr(this.ptr)
  }

  isAliasOf(other: any): boolean {
    if (other instanceof PathPtr) {
      return this.ptr === other.ptr
    }

    return false
  }

  isDeleted(): boolean {
    return this.ptr === -1
  }

  addOval(forceClose: boolean, dir: number): void {
    CanvasKitApi.Path.addOval(this.ptr, forceClose ? 1 : 0, dir | 0)
  }

  addRRect(rrect: any, forceClose: boolean): void {
    CanvasKitApi.Path.addRRect(this.ptr, rrect as unknown as number[], forceClose ? 1 : 0)
  }

  addRect(rect: any): void {
    CanvasKitApi.Path.addRect(this.ptr, rect as unknown as number[])
  }

  addPoly(points: number[], close: boolean): void {
    CanvasKitApi.Path.addPoly(this.ptr, points, close ? 1 : 0)
  }

  arcToOval(rect: any, startAngle: number, sweepAngle: number, forceMoveTo: boolean): void {
    CanvasKitApi.Path.arcTo(this.ptr, rect as unknown as number[], +startAngle, +sweepAngle, forceMoveTo ? 1 : 0)
  }

  arcToRotated(
    rx: number,
    ry: number,
    xAxisRotate: number,
    largeArc: boolean,
    clockwise: boolean,
    x: number,
    y: number
  ): void {
    CanvasKitApi.Path.arcToPoint(
      this.ptr,
      +rx,
      +ry,
      +xAxisRotate,
      largeArc ? 1 : 0,
      clockwise ? 1 : 0,
      +x,
      +y)
  }
}

//// => Path
// 路径类
export class Path extends ManagedObj {
  static fromSVGString (svg: string) {
    // TODO    
  }

  static from (other: Path) {
    // 
  }
  
  static combine (pathA: Path, pathB: Path) {
    // 
  }
  

  // => fillType
  // 填充方式
  #fillType: Skia.FillType = Engine.skia.FillType.Winding 
  public set fillType (fillType: Skia.FillType) {
    if (this._fillType !== fillType) {
      this._fillType = fillType
      this.skia.setFillType(fillType)
    }
  }
  public get fillType (): Skia.FillType {
    return this._fillType
  }
  
  // 缓存指令
  public commandsCached: number[] | null = null

  constructor () {
    super(new PathPtr())
  }

  addArc (oval: Rect, startAngle: number, sweepAngle: number): void {
    const degrees = 180 / Math.PI

    invariant(this.ptr, 'Path pointer is null in addArc.')

    this.ptr.addArc(
      oval as unknown as number[], 
      startAngle * degrees, 
      sweepAngle * degrees
    )
  }

  /**
   * 加入椭圆
   * @param {Rect} oval
   * @return {*}
   */  
  addOval (oval: Rect) {
    invariant(this.ptr, 'Path pointer is null in addOval.')
    this.ptr.addOval(oval, false, 1)
  }

  /**
   * 加入路径
   * @param {Path} path
   * @param {Offset} offset
   * @param {Matrix4} matrix4
   * @return {*}
   */
  addPath (
    path: Path,
    offset: Offset,
    matrix4: Matrix4 | null = null
  ) {
    let matrix: Float32Array
    if (matrix4 === null) {
      matrix = toMatrix(Matrix4.translationValues(offset.dx, offset.dy, 0))
    } else {
      matrix = toMatrix(matrix4)
      matrix[2] += offset.dx
      matrix[5] += offset.dy
    }

    this.skia.addPath(
      path.skia,
      matrix[0],
      matrix[1],
      matrix[2],
      matrix[3],
      matrix[4],
      matrix[5],
      matrix[6],
      matrix[7],
      matrix[8],
      false
    )
  }
  
  /**
   * 加入多边形
   * @param {Offset} points
   * @param {boolean} close
   * @return {*}
   */
  addPolygon (points: Offset[], close: boolean) {
    this.skia.addPoly(toPoints(points), close)
  }

  /**
   * 加入圆角矩形
   * @param {RRect} rrect
   * @return {void}
   */
  addRRect (rrect: RRect) {
    this.skia.addRRect(rrect, false)
  }

  /**
   * 加入矩形 
   * @param {Rect} rect
   * @return {void}
   */
  addRect (rect: Rect) {
    this.skia.addRect(rect)
  }

  /**
   * 圆角路径
   * @param {Rect} rect
   * @param {number} startAngle
   * @param {number} sweepAngle
   * @param {boolean} forceMoveTo
   * @return {*}
   */
  arcTo(
    rect: Rect, 
    startAngle: number, 
    sweepAngle: number, 
    forceMoveTo: boolean
  ) {
    const degrees = 180 / Math.PI
    this.skia.arcToOval(
      rect,
      startAngle * degrees,
      sweepAngle * degrees,
      forceMoveTo,
    )
  }

  /**
   * 圆角路径
   * @param {Offset} arcEnd
   * @param {Radius} radius
   * @param {number} rotation
   * @param {boolean} largeArc
   * @param {boolean} clockwise
   * @return {*}
   */
  arcToPoint(
    arcEnd: Offset,
    radius: Radius = Radius.ZERO,
    rotation: number = 0,
    largeArc: boolean = false,
    clockwise: boolean = true
  ) {
    this.skia.arcToRotated(
      radius.x,
      radius.y,
      rotation,
      largeArc,
      clockwise,
      arcEnd.dx,
      arcEnd.dy,
    )
  }

  /**
   * @param {boolean} forceClosed
   * @return {*}
   */
  // @MARK
  computeMetrics (forceClosed: boolean = false) {
    // return new PathMetrics(this, forceClosed)
  }


  /**
   * 是否包含某点
   * @param {Offset} point
   * @return {*}
   */
  contains (point: Offset) {
    return this.skia.contains(point.dx, point.dy)
  }

  /**
   * @description: 
   * @param {Path} path
   * @param {Offset} offset
   * @param {Matrix4} matrix4
   * @return {*}
   */
  extendWithPath (path: Path, offset: Offset, matrix4: Matrix4 | null = null) {
    let matrix: Float32Array
    if (matrix4 === null) {
      matrix = toMatrix(Matrix4.translationValues(offset.dx, offset.dy, 0))
    } else {
      matrix = toMatrix(matrix4)
      matrix[2] += offset.dx
      matrix[5] += offset.dy
    }
    
    this.skia.addPath(
      path.skia,
      matrix[0],
      matrix[1],
      matrix[2],
      matrix[3],
      matrix[4],
      matrix[5],
      matrix[6],
      matrix[7],
      matrix[8],
      true,
    )
  }

  /**
   * 获取矩形范围
   * @return {Rect}
   */
  getBounds (): Rect {
    const sk = this.skia.getBounds()
    return Rect.fromLTRB(sk[0], sk[1], sk[2], sk[3])
  }

  /**
   * @description: 
   * @param {number} x
   * @param {number} y
   * @return {*}
   */
  lineTo (x: number, y: number) {
    this.skia.lineTo(x, y)
  }

  /**
   * @description: 
   * @param {number} x
   * @param {number} y
   * @return {*}
   */
  moveTo (x: number, y: number) {
    this.skia.moveTo(x, y)
  }

  /**
   * @description: 
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @return {*}
   */
  quadraticBezierTo (
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number
  ) {
    this.skia.quadTo(x1, y1, x2, y2)
  }

  /**
   * @description: 
   * @param {Offset} arcEndDelta
   * @param {Radius} radius
   * @param {number} rotation
   * @param {boolean} largeArc
   * @param {boolean} clockwise
   * @return {*}
   */
  relativeArcToPoint (
    arcEndDelta: Offset,
    radius: Radius = Radius.ZERO,
    rotation: number = 0.0,
    largeArc: boolean = false,
    clockwise: boolean = true
  ) {
    this.skia.rArcTo(
      radius.x,
      radius.y,
      rotation,
      largeArc,
      clockwise,
      arcEndDelta.dx,
      arcEndDelta.dy,
    )
  }

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {number} w
   * @return {*}
   */
  relativeConicTo (
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number, 
    w: number
  ) {
    this.skia.rConicTo(x1, y1, x2, y2, w)
  }

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {number} x3
   * @param {number} y3
   * @return {*}
   */
  relativeCubicTo (
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number, 
    x3: number, 
    y3: number
  ) {
    this.skia.rCubicTo(x1, y1, x2, y2, x3, y3)
  }

  /**
   * @param {number} dx
   * @param {number} dy
   * @param {number} dy
   * @return {*}
   */
  relativeLineTo (dx: number, dy: number) {
    this.skia.rLineTo(dx, dy)
  }

  /**
   * 
   * @param {number} dx 
   * @param {number} dy 
   */
  relativeMoveTo (dx: number, dy: number) {
    this.skia.rMoveTo(dx, dy)
  }

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @return {*}
   */
  relativeQuadraticBezierTo (
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number
  ) {
    invariant(this.skia)
    this.skia.rQuadTo(x1, y1, x2, y2)
  }

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {number} w
   * @return {*}
   */
  conicTo (
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number, 
    w: number
  ) {
    invariant(this.skia)
    this.skia.conicTo(x1, y1, x2, y2, w)
  }

  /**
   * @param {Matrix4} matrix4
   * @return {*}
   */
  transform (matrix4: Matrix4) {
    invariant(this.skia)
    const skia = this.skia.copy() as Skia.Path
    const m = toMatrix(matrix4)
    
    skia.transform(
      m[0],
      m[1],
      m[2],
      m[3],
      m[4],
      m[5],
      m[6],
      m[7],
      m[8],
    )
    return Path.fromSkia(skia, this.fillType)
  }

  /**
   * @description: 
   * @param {Offset} offset
   * @return {*}
   */
  shift (offset: Offset) {
    const skia = this.skia.copy()
    skia.transform(
      1.0, 0.0, offset.dx,
      0.0, 1.0, offset.dy,
      0.0, 0.0, 1.0,
    )
    return Path.fromSkia(skia!, this.fillType)
  }

  /**
   * 关闭路径
   * @return {void}
   */
  close () {
    this.skia.close()
  }

  /**
   * 重置路径内容
   * @return {void}
   */
  reset () {
    this._fillType = Engine.skia.FillType.Winding
    this.skia.close()
  }

  /**
   * @return {Skia.Path}
   */
  resurrect (): Skia.Path {
    return Path.resurrect(this.cachedCommands ?? [], this.fillType)
  }

  /**
   * @description: 
   * @return {*}
   */
  toSVGString (): string | null {
    return this.skia.toSVGString() ?? null
  }

  toStrin () {
    return `Path()`
  }
}


