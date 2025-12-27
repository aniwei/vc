import { Size } from './Geometry'

export class EdgeInsets {
  static all(value: number): EdgeInsets {
    return new EdgeInsets(value, value, value, value)
  }

  static only({ left = 0, top = 0, right = 0, bottom = 0 }: Partial<EdgeInsets> = {}): EdgeInsets {
    return new EdgeInsets(left, top, right, bottom)
  }

  constructor(
    public readonly left: number,
    public readonly top: number,
    public readonly right: number,
    public readonly bottom: number,
  ) {}

  get horizontal(): number {
    return this.left + this.right
  }

  get vertical(): number {
    return this.top + this.bottom
  }

  inflateSize(size: Size): Size {
    return new Size(size.width + this.horizontal, size.height + this.vertical)
  }

  deflateSize(size: Size): Size {
    return new Size(size.width - this.horizontal, size.height - this.vertical)
  }
}
