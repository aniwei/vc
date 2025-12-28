export class Point {
  static readonly ZERO = new Point(0, 0)

  readonly x: number
  readonly y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  static of(x: number, y: number): Point {
    return new Point(x, y)
  }

  eq(other: Point | null): boolean {
    return !!other && other.x === this.x && other.y === this.y
  }

  add(other: Point): Point {
    return new Point(this.x + other.x, this.y + other.y)
  }

  sub(other: Point): Point {
    return new Point(this.x - other.x, this.y - other.y)
  }

  mul(scale: number): Point {
    return new Point(this.x * scale, this.y * scale)
  }

  div(scale: number): Point {
    return new Point(this.x / scale, this.y / scale)
  }

  mod(divisor: number): Point {
    return new Point(this.x % divisor, this.y % divisor)
  }

  clone(): Point {
    return new Point(this.x, this.y)
  }
}
