import invariant from 'invariant'

import { lerp } from 'shared'
import { Size } from 'geometry'
import { TextDirection } from 'bindings'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

const POSITIVE_INFINITY = Number.POSITIVE_INFINITY

export enum Axis {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export abstract class EdgeInsetsGeometry {
  static get INFINITY(): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      POSITIVE_INFINITY,
      POSITIVE_INFINITY,
      POSITIVE_INFINITY,
      POSITIVE_INFINITY,
      POSITIVE_INFINITY,
      POSITIVE_INFINITY,
    )
  }

  static lerp(a: EdgeInsetsGeometry | null, b: EdgeInsetsGeometry | null, t: number): EdgeInsetsGeometry | null {
    if (a === null && b === null) return null
    if (a === null) return b ? b.multiply(t) : null
    if (b === null) return a.multiply(1.0 - t)

    if (a instanceof EdgeInsets && b instanceof EdgeInsets) {
      return EdgeInsets.lerp(a, b, t)
    }

    if (a instanceof EdgeInsetsDirectional && b instanceof EdgeInsetsDirectional) {
      return EdgeInsetsDirectional.lerp(a, b, t)
    }

    return MixedEdgeInsets.fromLRSETB(
      lerp(a.left, b.left, t),
      lerp(a.right, b.right, t),
      lerp(a.start, b.start, t),
      lerp(a.end, b.end, t),
      lerp(a.top, b.top, t),
      lerp(a.bottom, b.bottom, t),
    )
  }

  get isNonNegative(): boolean {
    return (
      this.left >= 0 &&
      this.right >= 0 &&
      this.start >= 0 &&
      this.end >= 0 &&
      this.top >= 0 &&
      this.bottom >= 0
    )
  }

  get horizontal(): number {
    return this.left + this.right + this.start + this.end
  }

  get vertical(): number {
    return this.top + this.bottom
  }

  get collapsedSize(): Size {
    return new Size(this.horizontal, this.vertical)
  }

  get flipped(): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(this.right, this.left, this.end, this.start, this.bottom, this.top)
  }

  public bottom: number
  public end: number
  public left: number
  public right: number
  public start: number
  public top: number

  constructor(bottom: number, end: number, left: number, right: number, start: number, top: number) {
    this.bottom = bottom
    this.end = end
    this.left = left
    this.right = right
    this.start = start
    this.top = top
  }

  abstract add(other: EdgeInsetsGeometry): EdgeInsetsGeometry
  abstract subtract(other: EdgeInsetsGeometry): EdgeInsetsGeometry
  abstract inverse(): EdgeInsetsGeometry
  abstract multiply(other: number): EdgeInsetsGeometry
  abstract divide(other: number): EdgeInsetsGeometry
  abstract modulo(other: number): EdgeInsetsGeometry
  abstract resolve(direction: TextDirection): EdgeInsets

  along(axis: Axis): number {
    invariant(axis !== null, 'EdgeInsetsGeometry.along axis is null')
    return axis === Axis.Horizontal ? this.horizontal : this.vertical
  }

  inflateSize(size: Size): Size {
    return new Size(size.width + this.horizontal, size.height + this.vertical)
  }

  deflateSize(size: Size): Size {
    return new Size(size.width - this.horizontal, size.height - this.vertical)
  }

  clamp(min: EdgeInsetsGeometry, max: EdgeInsetsGeometry): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      clamp(this.left, min.left, max.left),
      clamp(this.right, min.right, max.right),
      clamp(this.start, min.start, max.start),
      clamp(this.end, min.end, max.end),
      clamp(this.top, min.top, max.top),
      clamp(this.bottom, min.bottom, max.bottom),
    )
  }

  equal(other: EdgeInsetsGeometry | null): boolean {
    return (
      other instanceof EdgeInsetsGeometry &&
      other.left === this.left &&
      other.right === this.right &&
      other.start === this.start &&
      other.end === this.end &&
      other.top === this.top &&
      other.bottom === this.bottom
    )
  }

  notEqual(other: EdgeInsetsGeometry | null): boolean {
    return !this.equal(other)
  }
}

export class EdgeInsets extends EdgeInsetsGeometry {
  static ZERO = EdgeInsets.only()

  static lerp(a: EdgeInsets | null, b: EdgeInsets | null, t: number): EdgeInsets | null {
    if (a === null && b === null) return null
    if (a === null) return b ? (b.multiply(t) as EdgeInsets) : null
    if (b === null) return a.multiply(1.0 - t) as EdgeInsets

    return EdgeInsets.fromLTRB(
      lerp(a.left, b.left, t),
      lerp(a.top, b.top, t),
      lerp(a.right, b.right, t),
      lerp(a.bottom, b.bottom, t),
    )
  }

  static fromLTRB(left: number, top: number, right: number, bottom: number): EdgeInsets {
    return new EdgeInsets(left, top, right, bottom)
  }

  static all(value: number): EdgeInsets {
    return new EdgeInsets(value, value, value, value)
  }

  static only(left: number = 0, top: number = 0, right: number = 0, bottom: number = 0): EdgeInsets {
    return new EdgeInsets(left, top, right, bottom)
  }

  static symmetric(vertical: number = 0.0, horizontal: number = 0.0): EdgeInsets {
    return new EdgeInsets(horizontal, vertical, horizontal, vertical)
  }

  constructor(left: number, top: number, right: number, bottom: number) {
    super(bottom, 0, left, right, 0, top)
  }

  add(other: EdgeInsetsGeometry): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      this.left + other.left,
      this.right + other.right,
      this.start + other.start,
      this.end + other.end,
      this.top + other.top,
      this.bottom + other.bottom,
    )
  }

  subtract(other: EdgeInsetsGeometry): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      this.left - other.left,
      this.right - other.right,
      this.start - other.start,
      this.end - other.end,
      this.top - other.top,
      this.bottom - other.bottom,
    )
  }

  inverse(): EdgeInsetsGeometry {
    return EdgeInsets.fromLTRB(-this.left, -this.top, -this.right, -this.bottom)
  }

  multiply(other: number): EdgeInsetsGeometry {
    return EdgeInsets.fromLTRB(this.left * other, this.top * other, this.right * other, this.bottom * other)
  }

  divide(other: number): EdgeInsetsGeometry {
    return EdgeInsets.fromLTRB(this.left / other, this.top / other, this.right / other, this.bottom / other)
  }

  modulo(other: number): EdgeInsetsGeometry {
    return EdgeInsets.fromLTRB(this.left % other, this.top % other, this.right % other, this.bottom % other)
  }

  resolve(_direction: TextDirection): EdgeInsets {
    return this
  }
}

export class EdgeInsetsDirectional extends EdgeInsetsGeometry {
  static ZERO = EdgeInsetsDirectional.only()

  static lerp(a: EdgeInsetsDirectional | null, b: EdgeInsetsDirectional | null, t: number): EdgeInsetsDirectional | null {
    if (a === null && b === null) return null
    if (a === null) return b ? (b.multiply(t) as EdgeInsetsDirectional) : null
    if (b === null) return a.multiply(1.0 - t) as EdgeInsetsDirectional

    return EdgeInsetsDirectional.only(
      lerp(a.start, b.start, t),
      lerp(a.top, b.top, t),
      lerp(a.end, b.end, t),
      lerp(a.bottom, b.bottom, t),
    )
  }

  static fromSTEB(start: number, top: number, end: number, bottom: number): EdgeInsetsDirectional {
    return new EdgeInsetsDirectional(start, top, end, bottom)
  }

  static only(start: number = 0, top: number = 0, end: number = 0, bottom: number = 0): EdgeInsetsDirectional {
    return new EdgeInsetsDirectional(start, top, end, bottom)
  }

  static all(value: number): EdgeInsetsDirectional {
    return new EdgeInsetsDirectional(value, value, value, value)
  }

  constructor(start: number, top: number, end: number, bottom: number) {
    super(bottom, end, 0, 0, start, top)
  }

  add(other: EdgeInsetsGeometry): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      this.left + other.left,
      this.right + other.right,
      this.start + other.start,
      this.end + other.end,
      this.top + other.top,
      this.bottom + other.bottom,
    )
  }

  subtract(other: EdgeInsetsGeometry): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      this.left - other.left,
      this.right - other.right,
      this.start - other.start,
      this.end - other.end,
      this.top - other.top,
      this.bottom - other.bottom,
    )
  }

  inverse(): EdgeInsetsGeometry {
    return EdgeInsetsDirectional.fromSTEB(-this.start, -this.top, -this.end, -this.bottom)
  }

  multiply(other: number): EdgeInsetsGeometry {
    return EdgeInsetsDirectional.fromSTEB(this.start * other, this.top * other, this.end * other, this.bottom * other)
  }

  divide(other: number): EdgeInsetsGeometry {
    return EdgeInsetsDirectional.fromSTEB(this.start / other, this.top / other, this.end / other, this.bottom / other)
  }

  modulo(other: number): EdgeInsetsGeometry {
    return EdgeInsetsDirectional.fromSTEB(this.start % other, this.top % other, this.end % other, this.bottom % other)
  }

  resolve(direction: TextDirection): EdgeInsets {
    invariant(direction !== null, 'EdgeInsetsDirectional.resolve direction is null')

    if (direction === TextDirection.RTL) {
      return EdgeInsets.fromLTRB(this.end, this.top, this.start, this.bottom)
    }

    return EdgeInsets.fromLTRB(this.start, this.top, this.end, this.bottom)
  }
}

export class MixedEdgeInsets extends EdgeInsetsGeometry {
  static fromLRSETB(left: number, right: number, start: number, end: number, top: number, bottom: number): MixedEdgeInsets {
    return new MixedEdgeInsets(left, right, start, end, top, bottom)
  }

  constructor(left: number, right: number, start: number, end: number, top: number, bottom: number) {
    super(bottom, end, left, right, start, top)
  }

  add(other: EdgeInsetsGeometry): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      this.left + other.left,
      this.right + other.right,
      this.start + other.start,
      this.end + other.end,
      this.top + other.top,
      this.bottom + other.bottom,
    )
  }

  subtract(other: EdgeInsetsGeometry): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      this.left - other.left,
      this.right - other.right,
      this.start - other.start,
      this.end - other.end,
      this.top - other.top,
      this.bottom - other.bottom,
    )
  }

  inverse(): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(-this.left, -this.right, -this.start, -this.end, -this.top, -this.bottom)
  }

  multiply(other: number): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      this.left * other,
      this.right * other,
      this.start * other,
      this.end * other,
      this.top * other,
      this.bottom * other,
    )
  }

  divide(other: number): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      this.left / other,
      this.right / other,
      this.start / other,
      this.end / other,
      this.top / other,
      this.bottom / other,
    )
  }

  modulo(other: number): EdgeInsetsGeometry {
    return MixedEdgeInsets.fromLRSETB(
      this.left % other,
      this.right % other,
      this.start % other,
      this.end % other,
      this.top % other,
      this.bottom % other,
    )
  }

  resolve(direction: TextDirection): EdgeInsets {
    invariant(direction !== null, 'MixedEdgeInsets.resolve direction is null')

    if (direction === TextDirection.RTL) {
      return EdgeInsets.fromLTRB(this.left + this.end, this.top, this.right + this.start, this.bottom)
    }

    return EdgeInsets.fromLTRB(this.left + this.start, this.top, this.right + this.end, this.bottom)
  }
}
