import { Size } from './Size'
import type { Rect } from './Rect'

declare const require: (id: string) => unknown

export class Offset {
  static readonly ZERO = new Offset(0, 0)

  readonly dx: number
  readonly dy: number

  constructor(dx: number, dy: number) {
    this.dx = dx
    this.dy = dy
  }

  static of(dx: number, dy: number): Offset {
    return new Offset(dx, dy)
  }

  translate(dx: number, dy: number): Offset {
    return new Offset(this.dx + dx, this.dy + dy)
  }

  and(size: Size): Rect {
    // Avoid a static circular dependency between Rect and Offset.
    const { Rect } = require('./Rect') as typeof import('./Rect')
    return Rect.fromLTWH(this.dx, this.dy, size.width, size.height)
  }
}
