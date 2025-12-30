import { Eq, DebugDescription } from 'shared'

export class Vec3 implements Eq<Vec3>, DebugDescription {
  static readonly Zero = new Vec3(0, 0, 0)

  readonly x: number
  readonly y: number
  readonly z: number

  constructor(x: number, y: number, z: number) {
    this.x = x
    this.y = y
    this.z = z
  }

  static of(x: number, y: number, z: number): Vec3 {
    return new Vec3(x, y, z)
  }

  add(other: Vec3): Vec3 {
    return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z)
  }

  sub(other: Vec3): Vec3 {
    return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z)
  }

  mul(scale: number): Vec3 {
    return new Vec3(this.x * scale, this.y * scale, this.z * scale)
  }

  div(scale: number): Vec3 {
    return new Vec3(this.x / scale, this.y / scale, this.z / scale)
  }

  dot(other: Vec3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z)
  }

  eq(other: Vec3 | null): boolean {
    return !!other && other.x === this.x && other.y === this.y && other.z === this.z
  }

  notEq(other: Vec3 | null): boolean {
    return !this.eq(other)
  }

  debugDescription(): string {
    return `Vec3(${this.x}, ${this.y}, ${this.z})`
  }
}
