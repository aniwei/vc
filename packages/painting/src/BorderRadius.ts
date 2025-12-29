import invariant from 'invariant'
import { Radius, Rect, RRect } from 'bindings'
import { TextDirection } from 'bindings'
import { Eq } from 'shared'



//// => BorderRadiusGeometry
export abstract class BorderRadiusGeometry implements Eq<BorderRadiusGeometry> {
  /**
   * 
   * @param {BorderRadiusGeometry | null} a 
   * @param {BorderRadiusGeometry | null} b 
   * @param {number} t 
   * @returns {BorderRadiusGeometry | null}
   */
  static lerp (
    a: BorderRadiusGeometry | null, 
    b: BorderRadiusGeometry | null, 
    t: number
  ): BorderRadiusGeometry | null {
    if (a === null && b === null) {
      return null
    }

    a ??= BorderRadius.Zero
    b ??= BorderRadius.Zero

    return a.add(b.sub(a).mul(t))
  }

  public topLeft: Radius
  public topRight: Radius
  public bottomLeft: Radius
  public bottomRight: Radius
  public topStart: Radius
  public topEnd: Radius
  public bottomStart: Radius
  public bottomEnd: Radius

  /**
   * 
   * @param {Radius} topLeft 
   * @param {Radius} topRight 
   * @param {Radius} bottomRight 
   * @param {Radius} bottomLeft 
   * @param {Radius} topStart 
   * @param {Radius} topEnd 
   * @param {Radius} bottomStart 
   * @param {Radius} bottomEnd 
   */
  constructor (
    topLeft: Radius,
    topRight: Radius,
    bottomRight: Radius,
    bottomLeft: Radius,
    topStart: Radius,
    topEnd: Radius,
    bottomStart: Radius,
    bottomEnd: Radius,
  ) {
    this.topLeft = topLeft
    this.topRight = topRight
    this.bottomRight = bottomRight
    this.bottomLeft = bottomLeft
    this.topStart = topStart
    this.topEnd = topEnd
    this.bottomStart = bottomStart
    this.bottomEnd = bottomEnd
  }

  /**
   * 圆角相加
   * @param {BorderRadiusGeometry} other 
   * @returns {BorderRadiusGeometry}
   */
  add (other: BorderRadiusGeometry): BorderRadiusGeometry {
    return new MixedBorderRadius(
      this.topLeft.add(other.topLeft),
      this.topRight.add(other.topRight),
      this.bottomLeft.add(other.bottomLeft),
      this.bottomRight.add(other.bottomRight),
      this.topStart.add(other.topStart),
      this.topEnd.add(other.topEnd),
      this.bottomStart.add(other.bottomStart),
      this.bottomEnd.add(other.bottomEnd))
  }

  /**
   * 
   * @param {BorderRadiusGeometry} other 
   * @returns {BorderRadiusGeometry}
   */
  sub(other: BorderRadiusGeometry): BorderRadiusGeometry {
    return new MixedBorderRadius(
      this.topLeft.sub(other.topLeft),
      this.topRight.sub(other.topRight),
      this.bottomLeft.sub(other.bottomLeft),
      this.bottomRight.sub(other.bottomRight),
      this.topStart.sub(other.topStart),
      this.topEnd.sub(other.topEnd),
      this.bottomStart.sub(other.bottomStart),
      this.bottomEnd.sub(other.bottomEnd),
    )
  }

  abstract mul (other: number): BorderRadiusGeometry
  abstract div (other: number): BorderRadiusGeometry
  abstract mod (other: number): BorderRadiusGeometry
  abstract inverse (): BorderRadiusGeometry
  abstract resolve (direction: TextDirection | null): BorderRadius

  eq(other: BorderRadiusGeometry | null) {
    return (
      other instanceof BorderRadiusGeometry &&
      other.topLeft.eq(this.topLeft) &&
      other.topRight.eq(this.topRight) &&
      other.bottomLeft.eq(this.bottomLeft) &&
      other.bottomRight.eq(this.bottomRight) &&
      other.topStart.eq(this.topStart) &&
      other.topEnd.eq(this.topEnd) &&
      other.bottomStart.eq(this.bottomStart) &&
      other.bottomEnd.eq(this.bottomEnd))
  }

  notEq(other: BorderRadiusGeometry | null) {
    return !this.eq(other)
  }

  debugDescription () {
    return `BorderRadiusGeometry(
      topLeft: ${this.topLeft},
      topRight: ${this.topRight},
      bottomLeft: ${this.bottomLeft},
      bottomRight: ${this.bottomRight},
      topStart: ${this.topStart},
      topEnd: ${this.topEnd},
      bottomStart: ${this.bottomStart},
      bottomEnd: ${this.bottomEnd},
    )`
  }
}

export class BorderRadius extends BorderRadiusGeometry {
  static Zero = BorderRadius.all(Radius.Zero)

  static all (radius: Radius) {
    return this.only(
      radius,
      radius,
      radius,
      radius)
  }

  static lerp (
    a: BorderRadius | null, 
    b: BorderRadius | null, 
    t: number
  ): BorderRadius | null {
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      invariant(b, 'BorderRadius.lerp a is null but b is also null')
      return b!.mul(t)
    }

    if (b == null) {
      return a.mul(1.0 - t)
    }

    return BorderRadius.only(
      Radius.lerp(a.topLeft, b.topLeft, t) as Radius,
      Radius.lerp(a.topRight, b.topRight, t) as Radius,
      Radius.lerp(a.bottomRight, b.bottomRight, t) as Radius,
      Radius.lerp(a.bottomLeft, b.bottomLeft, t) as Radius)
  }

  static circular (radius: number) {
    return BorderRadius.all(Radius.circular(radius))
  }

  static vertical (top: Radius = Radius.Zero, bottom: Radius = Radius.Zero,) {
    return BorderRadius.only(top, top, bottom, bottom)
  }

  static horizontal(left: Radius = Radius.Zero, right: Radius = Radius.Zero,) {
    return BorderRadius.only(left, right, right, left)
  } 

  static only(
    topLeft: Radius = Radius.Zero,
    topRight: Radius = Radius.Zero,
    bottomRight: Radius = Radius.Zero,
    bottomLeft: Radius = Radius.Zero
  ) {
    return new BorderRadius(
      topLeft, 
      topRight, 
      bottomRight, 
      bottomLeft)
  }

  constructor (
    topLeft: Radius,
    topRight: Radius,
    bottomRight: Radius,
    bottomLeft: Radius,
  ) {
    super(
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      Radius.Zero,
      Radius.Zero,
      Radius.Zero,
      Radius.Zero,
    )
  }

  /**
   * 复制 BorderRadius 对象
   * @param {Radius} topLeft
   * @param {Radius} topRight
   * @param {Radius} bottomRight
   * @param {Radius} bottomLeft
   * @return {*}
   */
  copyWith (
   topLeft:  Radius | null,
   topRight:  Radius | null,
   bottomRight:  Radius | null,
   bottomLeft:  Radius | null,
  ) {
    return BorderRadius.only(
      topLeft ?? this.topLeft,
      topRight ?? this.topRight,
      bottomRight ?? this.bottomRight,
      bottomLeft ?? this.bottomLeft)
  }

  /**
   * 
   * @param rect 
   * @returns 
   */
  toRRect (rect: Rect ): RRect {
    return RRect.fromRectAndCorners(
      rect,
      this.topLeft,
      this.topRight,
      this.bottomRight,
      this.bottomLeft)
  }

  inverse (): BorderRadius {
    return BorderRadius.only(
      this.topLeft.inverse(),
      this.topRight.inverse(),
      this.bottomRight.inverse(),
      this.bottomLeft.inverse())
  }

  sub (other: BorderRadiusGeometry): BorderRadiusGeometry {
    return BorderRadius.only(
      this.topLeft.subtract(other.topLeft),
      this.topRight.subtract(other.topRight),
      this.bottomRight.subtract(other.bottomRight),
      this.bottomLeft.subtract(other.bottomLeft))
  }

  add (other: BorderRadiusGeometry): BorderRadiusGeometry {
    return BorderRadius.only(
      this.topLeft.add(other.topLeft),
      this.topRight.add(other.topRight),
      this.bottomRight.add(other.bottomRight),
      this.bottomLeft.add(other.bottomLeft))
  }

  mul (other: number): BorderRadius {
    return BorderRadius.only(
      this.topLeft.mul(other),
      this.topRight.mul(other),
      this.bottomRight.mul(other),
      this.bottomLeft.mul(other))
  }

  div(other: number): BorderRadius {
    return BorderRadius.only(
      this.topLeft.div(other),
      this.topRight.div(other),
      this.bottomRight.div(other),
      this.bottomLeft.div(other))
  }

  mod (other: number): BorderRadius {
    return BorderRadius.only(
      this.topLeft.mod(other),
      this.topRight.mod(other),
      this.bottomRight.mod(other),
      this.bottomLeft.mod(other))
  }
  
  resolve (_direction: TextDirection | null) {
    return this
  }
}

export class BorderRadiusDirectional extends BorderRadiusGeometry {
  static Zero = BorderRadiusDirectional.all(Radius.Zero)

  /**
   * 插值计算
   * @param {BorderRadiusDirectional} a 
   * @param {BorderRadiusDirectional} b 
   * @param {number} t 
   * @returns {BorderRadiusDirectional | null}
   */
  static lerp (
    a: BorderRadiusDirectional | null, 
    b: BorderRadiusDirectional | null, 
    t: number
  ): BorderRadiusDirectional | null {    
    if (a === null && b === null) {
      return null
    }
    
    if (a === null) {
      invariant(b, 'BorderRadiusDirectional.lerp a is null but b is also null')
      return b!.mul(t)
    }

    if (b === null) {
      return a.mul(1.0 - t)
    }

    return BorderRadiusDirectional.only(
      Radius.lerp(a.topStart, b.topStart, t) as Radius,
      Radius.lerp(a.topEnd, b.topEnd, t) as Radius,
      Radius.lerp(a.bottomStart, b.bottomStart, t) as Radius,
      Radius.lerp(a.bottomEnd, b.bottomEnd, t) as Radius)
  }

  static all (radius: Radius) {
    return BorderRadiusDirectional.only(radius, radius, radius, radius)
  }

  static circular (radius: number) {
    return this.all(Radius.circular(radius))
  }

  /**
   * 
   * @param {Radius} top 
   * @param {Radius} bottom 
   * @returns {BorderRadiusDirectional}
   */
  static vertical (
    top: Radius = Radius.ZERO, 
    bottom: Radius = Radius.ZERO
  ) {
    return BorderRadiusDirectional.only(top, top, bottom, bottom)
  }

  /**
   * 
   * @param start 
   * @param end 
   * @returns 
   */
  static horizontal (
    start: Radius = Radius.ZERO, 
    end: Radius = Radius.ZERO
  ) {
    return BorderRadiusDirectional.only(
      start,
      end,
      start,
      end)
  }

  static only(
    topStart: Radius = Radius.ZERO,
    topEnd: Radius = Radius.ZERO,
    bottomStart: Radius = Radius.ZERO,
    bottomEnd: Radius = Radius.ZERO
  ) {
    return new BorderRadiusDirectional(
      topStart,
      topEnd,
      bottomStart,
      bottomEnd)
  }

  /**
   * 构造函数
   * @param {Radius} topStart 
   * @param {Radius} topEnd 
   * @param {Radius} bottomStart 
   * @param {Radius} bottomEnd 
   */
  constructor (
    topStart: Radius,
    topEnd: Radius,
    bottomStart: Radius,
    bottomEnd: Radius,
  ) { 
    super(
      Radius.ZERO,
      Radius.ZERO,
      Radius.ZERO,
      Radius.ZERO,
      topStart,
      topEnd,
      bottomStart,
      bottomEnd)
  }

  inverse (): BorderRadiusDirectional {
    return BorderRadiusDirectional.only(
      this.topStart.inverse(),
      this.topEnd.inverse(),
      this.bottomStart.inverse(),
      this.bottomEnd.inverse())
  }

  sub (other: BorderRadiusGeometry): BorderRadiusDirectional  {
    return BorderRadiusDirectional.only(
      this.topStart.sub(other.topStart),
      this.topEnd.sub(other.topEnd),
      this.bottomStart.sub(other.bottomStart),
      this.bottomEnd.sub(other.bottomEnd))
  }

  mul (other: number): BorderRadiusDirectional  {
    return BorderRadiusDirectional.only(
      this.topStart.mul(other),
      this.topEnd.mul(other),
      this.bottomStart.mul(other),
      this.bottomEnd.mul(other))
  }

  div (other: number): BorderRadiusDirectional  {
    return BorderRadiusDirectional.only(
      this.topStart.divide(other),
      this.topEnd.divide(other),
      this.bottomStart.divide(other),
      this.bottomEnd.divide(other))
  }

  mod (other: number): BorderRadiusDirectional  {
    return BorderRadiusDirectional.only(
      this.topStart.mod(other),
      this.topEnd.mod(other),
      this.bottomStart.mod(other),
      this.bottomEnd.mod(other))
  }
  
  resolve (direction: TextDirection | null): BorderRadius {
    invariant(direction !== null, 'BorderRadiusDirectional.resolve direction is null')

    if (direction === TextDirection.RTL) {
      return BorderRadius.only(
        this.topEnd,
        this.topStart,
        this.bottomEnd,
        this.bottomStart)
    } else {
      return BorderRadius.only(
        this.topStart,
        this.topEnd,
        this.bottomStart,
        this.bottomEnd)
    }
  }
}

export class MixedBorderRadius extends BorderRadiusGeometry {
  constructor (
    topLeft: Radius,
    topRight: Radius,
    bottomLeft: Radius,
    bottomRight: Radius,
    topStart: Radius,
    topEnd: Radius,
    bottomStart: Radius,
    bottomEnd: Radius,
  ) {
    super(
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      topStart,
      topEnd,
      bottomStart,
      bottomEnd)
  }

  inverse (): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.inverse(),
      this.topRight.inverse(),
      this.bottomLeft.inverse(),
      this.bottomRight.inverse(),
      this.topStart.inverse(),
      this.topEnd.inverse(),
      this.bottomStart.inverse(),
      this.bottomEnd.inverse())
  }

  add (other: MixedBorderRadius): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.add(other.topLeft),
      this.topRight.add(other.topRight),
      this.bottomLeft.add(other.bottomLeft),
      this.bottomRight.add(other.bottomRight),
      this.topStart.add(other.topStart),
      this.topEnd.add(other.topEnd),
      this.bottomStart.add(other.bottomStart),
      this.bottomEnd.add(other.bottomEnd),
    )
  }

  sub (other: MixedBorderRadius): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.sub(other.topLeft),
      this.topRight.sub(other.topRight),
      this.bottomLeft.sub(other.bottomLeft),
      this.bottomRight.sub(other.bottomRight),
      this.topStart.sub(other.topStart),
      this.topEnd.sub(other.topEnd),
      this.bottomStart.sub(other.bottomStart),
      this.bottomEnd.sub(other.bottomEnd))
  }

  mul (other: number): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.mul(other),
      this.topRight.mul(other),
      this.bottomLeft.mul(other),
      this.bottomRight.mul(other),
      this.topStart.mul(other),
      this.topEnd.mul(other),
      this.bottomStart.mul(other),
      this.bottomEnd.mul(other))
  }

  div (other: number): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.div(other),
      this.topRight.div(other),
      this.bottomLeft.div(other),
      this.bottomRight.div(other),
      this.topStart.div(other),
      this.topEnd.div(other),
      this.bottomStart.div(other),
      this.bottomEnd.div(other))
  }

  mod (other: number): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.mod(other),
      this.topRight.mod(other),
      this.bottomLeft.mod(other),
      this.bottomRight.mod(other),
      this.topStart.mod(other),
      this.topEnd.mod(other),
      this.bottomStart.mod(other),
      this.bottomEnd.mod(other))
  }
  
  resolve (direction: TextDirection | null): BorderRadius {
    invariant(direction !== null, 'MixedBorderRadius.resolve direction is null')

    if (direction === TextDirection.RTL) {
      return BorderRadius.only(
        this.topLeft.add(this.topEnd),
        this.topRight.add(this.topStart),
        this.bottomLeft.add(this.bottomEnd),
        this.bottomRight.add(this.bottomStart))
    } else {
      return BorderRadius.only(
        this.topLeft.add(this.topStart),
        this.topRight.add(this.topEnd),
        this.bottomLeft.add(this.bottomStart),
        this.bottomRight.add(this.bottomEnd))
    }
  }
}
