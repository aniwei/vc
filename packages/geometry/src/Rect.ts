import { Eq, DebugDescription } from 'shared'

import { Offset } from './Offset'
import { Size } from './Size'

export interface LTRB extends Array<number> {
  0: number
  1: number
  2: number
  3: number
}

export type LTRBRect = [number, number, number, number]

export class Rect implements Eq<Rect>, DebugDescription {
  static zero(): Rect {
    return Rect.Zero.clone()
  }

  static largest(): Rect {
    return Rect.Largest.clone()
  }

  static readonly Zero: Rect = new Rect(0, 0, 0, 0)
  static readonly Largest: Rect = new Rect(
    -Number.MAX_VALUE / 2, 
    -Number.MAX_VALUE / 2, 
    Number.MAX_VALUE / 2, 
    Number.MAX_VALUE / 2)

  static lerp(a: Rect | null, b: Rect | null, t: number): Rect | null {
    if (t === null || Number.isNaN(t)) {
      throw new Error('The argument "t" cannot be null or NaN.')
    }

    if (b === null) {
      if (a === null) return null
      const k = 1.0 - t
      return Rect.fromLTRB(a.left * k, a.top * k, a.right * k, a.bottom * k)
    }

    if (a === null) {
      return Rect.fromLTRB(b.left * t, b.top * t, b.right * t, b.bottom * t)
    }

    return Rect.fromLTRB(
      a.left + (b.left - a.left) * t,
      a.top + (b.top - a.top) * t,
      a.right + (b.right - a.right) * t,
      a.bottom + (b.bottom - a.bottom) * t,
    )
  }

  static fromLTWH(left: number, top: number, width: number, height: number): Rect {
    return new Rect(left, top, left + width, top + height)
  }

  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number

  constructor(left: number, top: number, right: number, bottom: number) {
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
  }

  static fromLTRB(left: number, top: number, right: number, bottom: number): Rect {
    return new Rect(left, top, right, bottom)
  }

  get width(): number {
    return this.right - this.left
  }

  get height(): number {
    return this.bottom - this.top
  }

  get size(): Size {
    return new Size(this.width, this.height)
  }

  get topLeft(): Offset {
    return new Offset(this.left, this.top)
  }

  isEmpty(): boolean {
    return this.width <= 0 || this.height <= 0
  }

  add(size: Size): Rect {
    return Rect.fromLTWH(this.left, this.top, this.width + size.width, this.height + size.height)
  }

  sub(size: Size): Rect {
    return Rect.fromLTWH(this.left, this.top, this.width - size.width, this.height - size.height)
  }

  expandToInclude(rect: Rect): Rect {
    return Rect.fromLTRB(
      Math.min(this.left, rect.left),
      Math.min(this.top, rect.top),
      Math.max(this.right, rect.right),
      Math.max(this.bottom, rect.bottom))
  }

  overlaps(rect: Rect): boolean {
    if (this.right <= rect.left || rect.right <= this.left) {
      return false
    }

    if (this.bottom <= rect.top || rect.bottom <= this.top) {
      return false
    }

    return true
  }

  clone(): Rect {
    return new Rect(this.left, this.top, this.right, this.bottom)
  }

  ltrb(): LTRB {
    return [this.left, this.top, this.right, this.bottom]
  }

  eq(other: Rect | null): boolean {
    return (
      !!other &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom
    )
  }

  notEq(other: Rect | null): boolean {
    return !this.eq(other)
  } 

  debugDescription(): string {
    return `Rect(${this.left}, ${this.top}, ${this.right}, ${this.bottom})`
  }
}
