import { Offset, Rect, Size } from 'geometry'

export class RelativeRect {
  static readonly FILL = RelativeRect.fromLTRB(0, 0, 0, 0)

  static lerp(a: RelativeRect | null, b: RelativeRect | null, t: number): RelativeRect | null {
    if (a === null && b === null) return null
    if (a === null) {
      return RelativeRect.fromLTRB(b!.left * t, b!.top * t, b!.right * t, b!.bottom * t)
    }
    if (b === null) {
      const k = 1 - t
      return RelativeRect.fromLTRB(a.left * k, a.top * k, a.right * k, a.bottom * k)
    }

    const lerpNum = (x: number, y: number) => x + (y - x) * t
    return RelativeRect.fromLTRB(
      lerpNum(a.left, b.left),
      lerpNum(a.top, b.top),
      lerpNum(a.right, b.right),
      lerpNum(a.bottom, b.bottom),
    )
  }

  static fromLTRB(left: number, top: number, right: number, bottom: number): RelativeRect {
    return new RelativeRect(left, top, right, bottom)
  }

  static fromSize(rect: Rect, container: Size): RelativeRect {
    return RelativeRect.fromLTRB(rect.left, rect.top, container.width - rect.right, container.height - rect.bottom)
  }

  static fromRect(rect: Rect, container: Rect): RelativeRect {
    return RelativeRect.fromLTRB(
      rect.left - container.left,
      rect.top - container.top,
      container.right - rect.right,
      container.bottom - rect.bottom,
    )
  }

  constructor(
    public left: number,
    public top: number,
    public right: number,
    public bottom: number,
  ) {}

  get hasInsets(): boolean {
    return this.left > 0 || this.top > 0 || this.right > 0 || this.bottom > 0
  }

  shift(offset: Offset): RelativeRect {
    return RelativeRect.fromLTRB(
      this.left + offset.dx,
      this.top + offset.dy,
      this.right - offset.dx,
      this.bottom - offset.dy,
    )
  }

  inflate(delta: number): RelativeRect {
    return RelativeRect.fromLTRB(this.left - delta, this.top - delta, this.right - delta, this.bottom - delta)
  }

  deflate(delta: number): RelativeRect {
    return this.inflate(-delta)
  }

  intersect(other: RelativeRect): RelativeRect {
    return RelativeRect.fromLTRB(
      Math.max(this.left, other.left),
      Math.max(this.top, other.top),
      Math.max(this.right, other.right),
      Math.max(this.bottom, other.bottom),
    )
  }

  toRect(container: Rect): Rect {
    return Rect.fromLTRB(this.left, this.top, container.width - this.right, container.height - this.bottom)
  }

  toSize(container: Size): Size {
    return new Size(container.width - this.left - this.right, container.height - this.top - this.bottom)
  }

  equal(other: RelativeRect | null): boolean {
    return (
      other instanceof RelativeRect &&
      other.left === this.left &&
      other.top === this.top &&
      other.right === this.right &&
      other.bottom === this.bottom
    )
  }

  notEqual(other: RelativeRect | null): boolean {
    return !this.equal(other)
  }

  toString(): string {
    return `RelativeRect.fromLTRB(left: ${this.left}, top: ${this.top}, right: ${this.right}, bottom: ${this.bottom})`
  }
}
