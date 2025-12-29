import invariant from 'invariant'

import { Paint } from 'bindings'
import { PaintStyle } from 'bindings'

import { Color } from './Color'

// 边框形状
export enum BorderShape {
  Rectangle = 0,
  Circle = 1,
  Irregular = 2,
}

// 边框样式
export enum BorderStyle {
  None = 0,
  Solid = 1,
  Dotted = 2,
  Dashed = 3,
}

// 边框位置（当前仅保留数据；绘制端暂未区分）
export enum BorderPosition {
  Outside = 0,
  Center = 1,
  Inside = 2,
}

export interface BorderSideOptions {
  color?: number
  width?: number
  style?: BorderStyle
  position?: BorderPosition
  pettern?: number[]
}

export class BorderSide {
  static readonly NONE = new BorderSide(0xff000000, 0, BorderStyle.None)

  static create(options: BorderSideOptions = {}): BorderSide {
    return new BorderSide(
      (options.color ?? 0xff000000) >>> 0,
      options.width ?? 1,
      options.style ?? BorderStyle.Solid,
      options.position ?? BorderPosition.Center,
      options.pettern ?? [],
    )
  }

  static merge(a: BorderSide, b: BorderSide): BorderSide {
    const aIsNone = a.style === BorderStyle.None && a.width === 0
    const bIsNone = b.style === BorderStyle.None && b.width === 0

    if (aIsNone && bIsNone) return BorderSide.NONE
    if (aIsNone) return b
    if (bIsNone) return a

    invariant(a.color === b.color, 'BorderSide.merge: colors must match')
    invariant(a.style === b.style, 'BorderSide.merge: styles must match')

    return new BorderSide(a.color, a.width + b.width, a.style, a.position, a.pettern)
  }

  static canMerge(a: BorderSide, b: BorderSide): boolean {
    if ((a.style === BorderStyle.None && a.width === 0) || (b.style === BorderStyle.None && b.width === 0)) {
      return true
    }

    return a.style === b.style && a.color === b.color
  }

  static lerp(a: BorderSide, b: BorderSide, t: number): BorderSide {
    if (t === 0) return a
    if (t === 1) return b

    const width = a.width + (b.width - a.width) * t
    if (width < 0) return BorderSide.NONE

    if (a.style === b.style) {
      return new BorderSide(Color.lerp(a.color, b.color, t), width, a.style, a.position, a.pettern)
    }

    // None <-> Solid：按 alpha 淡入淡出
    const colorA = a.style === BorderStyle.None ? Color.withAlpha(a.color, 0) : a.color
    const colorB = b.style === BorderStyle.None ? Color.withAlpha(b.color, 0) : b.color
    const style = t < 0.5 ? a.style : b.style
    return new BorderSide(Color.lerp(colorA, colorB, t), width, style, t < 0.5 ? a.position : b.position, t < 0.5 ? a.pettern : b.pettern)
  }

  public readonly color: number
  public readonly width: number
  public readonly style: BorderStyle
  public readonly position: BorderPosition
  public readonly pettern: number[]

  constructor(
    color: number = 0xff000000,
    width: number = 1,
    style: BorderStyle = BorderStyle.Solid,
    position: BorderPosition = BorderPosition.Center,
    pettern: number[] = [],
  ) {
    invariant(width >= 0, 'BorderSide.width must be >= 0')
    this.color = color >>> 0
    this.width = width
    this.style = style
    this.position = position
    this.pettern = pettern
  }

  copyWith(
    color: number | null,
    width: number | null,
    style: BorderStyle | null,
    position: BorderPosition | null,
    pettern: number[] | null,
  ): BorderSide {
    invariant(width === null || width >= 0, 'BorderSide.copyWith: width must be >= 0')
    return new BorderSide(
      (color ?? this.color) >>> 0,
      width ?? this.width,
      style ?? this.style,
      position ?? this.position,
      pettern ?? this.pettern,
    )
  }

  scale(t: number): BorderSide {
    return new BorderSide(this.color, Math.max(0, this.width * t), t > 0 ? this.style : BorderStyle.None, this.position, this.pettern)
  }

  toPaint(): Paint {
    const paint = new Paint().setAntiAlias(true)

    switch (this.style) {
      case BorderStyle.Solid:
      case BorderStyle.Dashed:
      case BorderStyle.Dotted: {
        paint.setColor(this.color)
        paint.setStyle(PaintStyle.Stroke)
        paint.setStrokeWidth(this.width)
        // NOTE: 当前 bindings 未暴露 PathEffect；Dashed/Dotted 暂时按实线绘制。
        return paint
      }
      case BorderStyle.None: {
        paint.setColor(0x00000000)
        paint.setStyle(PaintStyle.Stroke)
        paint.setStrokeWidth(0)
        return paint
      }
    }
  }

  eq(other: BorderSide | null): boolean {
    return (
      other instanceof BorderSide &&
      other.color === this.color &&
      other.width === this.width &&
      other.style === this.style &&
      other.position === this.position
    )
  }

  notEq(other: BorderSide | null): boolean {
    return !this.eq(other)
  }
}

export abstract class ShapeBorder<T extends ShapeBorder<T>> {
  abstract getOuterPath(shape: unknown, textDirection?: any | null): any
  abstract getInnerPath(shape: unknown, textDirection?: any | null): any

  abstract paint(
    canvas: any,
    rect: unknown,
    textDirection?: any | null,
    shape?: BorderShape,
    borderRadius?: any | null,
  ): void

  add(_other: T, _reversed: boolean = false): T | null {
    return null
  }

  scale(_t: number): T {
    throw new Error('ShapeBorder.scale must be implemented')
  }

  lerpFrom(_a: ShapeBorder<T> | null, _t: number): ShapeBorder<T> | null {
    return null
  }

  lerpTo(_b: ShapeBorder<T> | null, _t: number): ShapeBorder<T> | null {
    return null
  }
}
