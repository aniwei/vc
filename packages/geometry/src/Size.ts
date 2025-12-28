export class Size {
  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {}

  isEmpty(): boolean {
    return this.width <= 0 || this.height <= 0
  }

  eq(other: Size | null): boolean {
    return !!other && other.width === this.width && other.height === this.height
  }

  mul(scale: number): Size {
    return new Size(this.width * scale, this.height * scale)
  }

  div(scale: number): Size {
    return new Size(this.width / scale, this.height / scale)
  }

  add(other: Size): Size {
    return new Size(this.width + other.width, this.height + other.height)
  }

  sub(other: Size): Size {
    return new Size(this.width - other.width, this.height - other.height)
  }
}
