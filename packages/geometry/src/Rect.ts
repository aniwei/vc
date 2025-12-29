import { Offset } from './Offset'
import { Size } from './Size'

export interface LTRB extends Array<number> {
  0: number
  1: number
  2: number
  3: number
}

export type LTRBRect = [number, number, number, number]

export class Rect {
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

  eq(other: Rect | null): boolean {
    return (
      !!other &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom
    )
  }

  toLTRB(): LTRB {
    return [this.left, this.top, this.right, this.bottom]
  }
}
