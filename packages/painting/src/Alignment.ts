import invariant from 'invariant'
import { Offset, Rect, Size } from 'geometry'
import { TextDirection } from 'bindings'
import { Eq, lerp } from 'shared'

export abstract class AlignmentGeometry extends Eq<AlignmentGeometry> {
  /**
   * 插值计算
   * @param {AlignmentGeometry | null} a
   * @param {AlignmentGeometry | null} b
   * @param {number} t
   * @return {AlignmentGeometry | null}
   */
  static lerp(
    a: AlignmentGeometry | null, 
    b: AlignmentGeometry | null, 
    t: number
  ): AlignmentGeometry | null {
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return (b as AlignmentGeometry).mul(t)
    }

    if (b === null) {
      return a.mul(1.0 - t)
    }

    if (a instanceof Alignment && b instanceof Alignment) {
      return Alignment.lerp(a, b, t)
    }

    if (a instanceof AlignmentDirectional && b instanceof AlignmentDirectional) {
      return AlignmentDirectional.lerp(a, b, t)
    }

    return new MixedAlignment(
      lerp(a.x, b.x, t),
      lerp(a.y, b.y, t),
      lerp(a.start, b.start, t))
  }

  public start: number
  public x: number
  public y: number

  /**
   * 
   * @param {number} x 
   * @param {number} y 
   * @param {number} start 
   */
  constructor (x: number, y: number, start: number) {
    super()
    this.x = x
    this.y = y
    this.start = start
  }
  
  abstract add (other: AlignmentGeometry): AlignmentGeometry
  abstract sub (other: AlignmentGeometry): AlignmentGeometry 
  abstract mul (other: number): AlignmentGeometry 
  abstract div (other: number): AlignmentGeometry
  abstract mod (other: number): AlignmentGeometry
  abstract neg (): AlignmentGeometry 
  abstract resolve (direction: TextDirection | null): Alignment

  eq (other: AlignmentGeometry | null) {
    return (
      other instanceof AlignmentGeometry &&
      other.x === this.x &&
      other.y === this.y &&
      other.start === this.start
    )
  }

  notEq (other: AlignmentGeometry | null) {
    return !this.eq(other)
  }

  description () {
    return `AlignmentGeometry(x: ${this.x}, y: ${this.y}, start: ${this.start})`
  }
}

//// => Alignment
export class Alignment extends AlignmentGeometry {
  static TopLeft = new Alignment(-1.0, -1.0)
  static TopCenter = new Alignment(0.0, -1.0)
  static TopRight = new Alignment(1.0, -1.0)

  static CenterLeft = new Alignment(-1.0, 0.0)
  static Center = new Alignment(0.0, 0.0)
  static CenterRight = new Alignment(1.0, 0.0)

  static BottomLeft = new Alignment(-1.0, 1.0)
  static BottomCenter = new Alignment(0.0, 1.0)
  static BottomRight = new Alignment(1.0, 1.0)

  /**
   * 插值计算
   * @param {Alignment | null} a
   * @param {Alignment | null} b
   * @param {number} t
   * @return {Alignment | nulls}
   */
  static lerp(
    a: Alignment | null, 
    b: Alignment | null, 
    t: number
  ): Alignment | null {
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return new Alignment(
        lerp(0.0, (b as Alignment).x, t), 
        lerp(0.0, (b as Alignment).y, t))
    }

    if (b === null) {
      return new Alignment(
        lerp(a.x, 0.0, t), 
        lerp(a.y, 0.0, t))
    }

    return new Alignment(
      lerp(a.x, b.x, t), 
      lerp(a.y, b.y, t))
  }

  /**
   * @description: 
   * @param {number} x
   * @param {number} y
   * @return {Alignment}
   */  
  constructor (x: number,y: number) {
    super(x, y, 0)
  }

  /**
   * @description: 
   * @return {*}
   */  
  inverse () {
    return new Alignment(-this.x, -this.y,)
  }

  /**
   * @description: 
   * @param {Alignment} other
   * @return {*}
   */  
  sub(other: Alignment): Alignment {
    return new Alignment(
      this.x - other.x,
      this.y - other.y)
  }

  add(other: Alignment): Alignment {
    return new Alignment(
      this.x + other.x, 
      this.y + other.y)
  }

  div(other: number): Alignment {
    return new Alignment(
      this.x / other, 
      this.y / other)
  }

  mul(other: number): Alignment {
    return new Alignment(
      this.x * other, 
      this.y * other)
  }

  mod(other: number): Alignment {
    return new Alignment(
      this.x % other, 
      this.y % other)
  }

  neg(): Alignment  {
    return new Alignment(
      -this.x, 
      -this.y)
  }

  alongOffset (other: Offset) {
    const centerX = other.dx / 2.0
    const centerY = other.dy / 2.0
    
    return new Offset(
      centerX + this.x * centerX, 
      centerY + this.y * centerY)
  }

  alongSize (other: Size) {
    const centerX = other.width / 2.0
    const centerY = other.height / 2.0
    return new Offset(
      centerX + this.x * centerX, 
      centerY + this.y * centerY)
  }

  withinRect (rect: Rect) {
    const halfWidth = rect.width / 2
    const halfHeight = rect.height / 2

    return new Offset(
      rect.left + halfWidth + this.x * halfWidth,
      rect.top + halfHeight + this.y * halfHeight)
  }

  inscribe (size: Size, rect: Rect) {
    const halfWidthDelta = (rect.width - size.width) / 2.0
    const halfHeightDelta = (rect.height - size.height) / 2.0

    return Rect.fromLTWH(
      rect.left + halfWidthDelta + this.x * halfWidthDelta,
      rect.top + halfHeightDelta + this.y * halfHeightDelta,
      size.width,
      size.height)
  }

  resolve (_direction: TextDirection | null): Alignment {
    return this
  } 

  debugDescription () {
    return `Alignment(x: ${this.x}, y: ${this.y}, start: ${this.start})`
  }
}

//// => AlignmentDirectional
export class AlignmentDirectional extends AlignmentGeometry {
  static TopStart = new AlignmentDirectional(-1.0, -1.0)
  static TopCenter = new AlignmentDirectional(0.0, -1.0)
  static TopEnd = new AlignmentDirectional(1.0, -1.0)
  static CenterStart = new AlignmentDirectional(-1.0, 0.0)
  static Center = new AlignmentDirectional(0.0, 0.0)
  static CenterEnd = new AlignmentDirectional(1.0, 0.0)
  static BottomStart = new AlignmentDirectional(-1.0, 1.0)
  static BottomCenter = new AlignmentDirectional(0.0, 1.0)
  static BottomEnd = new AlignmentDirectional(1.0, 1.0)

  /**
   * @param {AlignmentDirectional | null} a
   * @param {AlignmentDirectional | null} b
   * @param {number} t
   * @return {AlignmentDirectional | null}
   */
  static lerp (
    a: AlignmentDirectional | null, 
    b: AlignmentDirectional | null, 
    t: number
  ): AlignmentDirectional | null {    
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return new AlignmentDirectional(
        lerp(0, (b as AlignmentDirectional).start, t)!, 
        lerp(0, (b as AlignmentDirectional).y, t)!
      )
    }

    if (b === null) {
      return new AlignmentDirectional(lerp(a.start, 0, t), lerp(a.y, 0, t))
    }

    return new AlignmentDirectional(lerp(a.start, b.start, t), lerp(a.y, b.y, t))
  }

  /**
   * @param {number} y
   * @param {number} start
   * @return {*}
   */  
  constructor (y: number, start: number) {
    super(0, y, start)
  }

  add (other: AlignmentGeometry): AlignmentGeometry {
    return new AlignmentDirectional(
      this.start + other.start, 
      this.y + other.y)
  }
  
  sub (other: AlignmentDirectional): AlignmentGeometry {
    return new AlignmentDirectional(
      this.start - other.start, 
      this.y - other.y)
  }

  neg () {
    return new AlignmentDirectional(
      -this.start, 
      -this.y)
  }
  
  mul (other: number) {
    return new AlignmentDirectional(
      this.start * other, 
      this.y * other)
  }

  div (other: number) {
    return new AlignmentDirectional(
      this.start / other, 
      this.y / other)
  }
   
  mod (other: number) {
    return new AlignmentDirectional(
      this.start % other, 
      this.y % other)
  }
  
  resolve (direction: TextDirection | null): Alignment {
    invariant(direction !== null, 'Cannot resolve AlignmentDirectional without a TextDirection.')

    if (direction === TextDirection.RTL) {
      return new Alignment(-this.start, this.y)
    } else {
      return new Alignment(this.start, this.y) 
    }
  }

  debugDescription () {
    return `AlignmentDirectional(
      [y]: ${this.y}, 
      [start]: ${this.start}
    )`
  }
}

//// => MixedAlignment
export class MixedAlignment extends AlignmentGeometry {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} start
   * @return {MixedAlignment}
   */  
  constructor (x: number, y: number, start: number) {
    super(x, y, start)

    this.x = x
    this.y = y
    this.start = start
  }

  neg (): MixedAlignment {
    return new MixedAlignment(-this.x, -this.start, -this.y)
  }

  add (other: MixedAlignment) {
    return new MixedAlignment(
      this.x + other.x,
      this.y + other.y,
      this.start + other.start)
  }

  sub (other: MixedAlignment): MixedAlignment {
    return new MixedAlignment(
      this.x - other.x,
      this.y - other.y,
      this.start - other.start)
  }

  mul (other: number): MixedAlignment {
    return new MixedAlignment(
      this.x * other,
      this.y * other,
      this.start * other)
  }
  
  div (other: number): MixedAlignment {
    return new MixedAlignment(
      this.x / other,
      this.y / other,
      this.start / other)
  }

  /**
   * @description: 
   * @param {number} other
   * @return {*}
   */  
  mod (other: number): MixedAlignment  {
    return new MixedAlignment(
      this.x % other,
      this.y % other,
      this.start % other)
  }

  /**
   * @description: 
   * @param {TextDirection} direction
   * @return {*}
   */  
  resolve (direction: TextDirection): Alignment {
    if (direction === TextDirection.RTL) {
      return new Alignment(
        this.x - this.start, 
        this.y)
    } else {
      return new Alignment(
        this.x + this.start, 
        this.y)
    }
  }

  debugDescription () {
    return `MixedAlignment(x: ${this.x}, y: ${this.y}, start: ${this.start})`
  }
}

