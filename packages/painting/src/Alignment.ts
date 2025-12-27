import { Offset, Rect, Size } from './Geometry'

export class Alignment {
  static readonly TOP_LEFT = new Alignment(-1, -1)
  static readonly TOP_CENTER = new Alignment(0, -1)
  static readonly TOP_RIGHT = new Alignment(1, -1)
  static readonly CENTER_LEFT = new Alignment(-1, 0)
  static readonly CENTER = new Alignment(0, 0)
  static readonly CENTER_RIGHT = new Alignment(1, 0)
  static readonly BOTTOM_LEFT = new Alignment(-1, 1)
  static readonly BOTTOM_CENTER = new Alignment(0, 1)
  static readonly BOTTOM_RIGHT = new Alignment(1, 1)

  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  inscribe(size: Size, rect: Rect): Rect {
    const halfWidthDelta = (rect.width - size.width) / 2
    const halfHeightDelta = (rect.height - size.height) / 2

    const dx = halfWidthDelta + this.x * halfWidthDelta
    const dy = halfHeightDelta + this.y * halfHeightDelta
    const origin: Offset = rect.topLeft.translate(dx, dy)
    return origin.and(size)
  }
}
