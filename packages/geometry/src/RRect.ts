import { DebugDescription, Eq } from 'shared'
import { Radius } from './Radius'
import { Rect } from './Rect'

export class RRect implements Eq<RRect>, DebugDescription {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number

  readonly tlRadius: Radius
  readonly trRadius: Radius
  readonly brRadius: Radius
  readonly blRadius: Radius

  constructor(
    left: number,
    top: number,
    right: number,
    bottom: number,
    tlRadius: Radius,
    trRadius: Radius,
    brRadius: Radius,
    blRadius: Radius,
  ) {
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
    this.tlRadius = tlRadius
    this.trRadius = trRadius
    this.brRadius = brRadius
    this.blRadius = blRadius
  }

  static fromRectAndCorners(
    rect: Rect,
    topLeft: Radius = Radius.Zero,
    topRight: Radius = Radius.Zero,
    bottomRight: Radius = Radius.Zero,
    bottomLeft: Radius = Radius.Zero,
  ): RRect {
    return new RRect(
      rect.left,
      rect.top,
      rect.right,
      rect.bottom,
      topLeft,
      topRight,
      bottomRight,
      bottomLeft)
  }

  static fromRectXY(rect: Rect, rx: number, ry: number): RRect {
    const radius = Radius.elliptical(rx, ry)
    return RRect.fromRectAndCorners(rect, radius, radius, radius, radius)
  }

  static fromLTRBXY(left: number, top: number, right: number, bottom: number, rx: number, ry: number): RRect {
    return RRect.fromRectXY(Rect.fromLTRB(left, top, right, bottom), rx, ry)
  }

  get width(): number {
    return this.right - this.left
  }

  get height(): number {
    return this.bottom - this.top
  }

  get outer(): Rect {
    return Rect.fromLTRB(this.left, this.top, this.right, this.bottom)
  }

  eq(other: RRect | null): boolean {
    return (
      !!other &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom &&
      other.tlRadius.eq(this.tlRadius) &&
      other.trRadius.eq(this.trRadius) &&
      other.brRadius.eq(this.brRadius) &&
      other.blRadius.eq(this.blRadius))
  }

  notEq(other: RRect | null): boolean {
    return !this.eq(other)
  }

  debugDescription(): string {
    return `RRect(${this.left}, ${this.top}, ${this.right}, ${this.bottom}, `
      + `tlRadius: ${this.tlRadius.debugDescription()}, `
      + `trRadius: ${this.trRadius.debugDescription()}, `
      + `brRadius: ${this.brRadius.debugDescription()}, `
      + `blRadius: ${this.blRadius.debugDescription()})`
  }
}
