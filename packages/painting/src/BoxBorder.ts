import invariant from 'invariant'

import { Canvas, Path, Paint, PaintStyle, PathFillType, Rect, TextDirection } from 'bindings'

import { BorderRadius } from './BorderRadius'
import { EdgeInsets, EdgeInsetsGeometry } from './EdgeInsets'
import { paintBorderWithRectangle } from './paintBorderWithRectangle'
import { BorderSide, BorderShape, BorderStyle, ShapeBorder } from './Border'

export type BoxBorderOptions = {
  color?: number
  width?: number
  style?: BorderStyle
}

function rectDeflate(rect: Rect, delta: number): Rect {
  return Rect.fromLTRB(rect.left + delta, rect.top + delta, rect.right - delta, rect.bottom - delta)
}

function rectCenter(rect: Rect): { x: number; y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function rectShortestSide(rect: Rect): number {
  return Math.min(rect.width, rect.height)
}

function deflateRectByInsets(rect: Rect, insets: EdgeInsets): Rect {
  return Rect.fromLTRB(rect.left + insets.left, rect.top + insets.top, rect.right - insets.right, rect.bottom - insets.bottom)
}

function uniformCornerRadiusXY(borderRadius: BorderRadius): { rx: number; ry: number } {
  // 当前 bindings Path 只支持 addRRectXY（统一圆角），这里用 topLeft 作为退化半径。
  const rx = borderRadius.topLeft.x
  const ry = borderRadius.topLeft.y
  return { rx, ry }
}

export class BoxBorder extends ShapeBorder<BoxBorder> {
  static create(options: BoxBorderOptions): BoxBorder {
    const side = new BorderSide(options.color ?? 0xff000000, options.width ?? 1.0, options.style ?? BorderStyle.Solid)
    return BoxBorder.fromBorderSide(side)
  }

  static all(color: number = 0xff000000, width: number = 1.0, style: BorderStyle = BorderStyle.Solid): BoxBorder {
    return BoxBorder.fromBorderSide(BorderSide.create({ color, width, style }))
  }

  static fromBorderSide(side: BorderSide): BoxBorder {
    invariant(side !== null, 'BoxBorder.fromBorderSide: side is null')
    return new BoxBorder(side, side, side, side)
  }

  static paintUniformBorderWithCircle(canvas: Canvas, rect: Rect, side: BorderSide): void {
    invariant(side.style !== BorderStyle.None, 'BoxBorder.paintUniformBorderWithCircle: side is none')
    const width = side.width
    const paint = side.toPaint()

    try {
      const radius = (rectShortestSide(rect) - width) / 2.0
      const c = rectCenter(rect)
      canvas.drawCircle(c.x, c.y, radius, paint)
    } finally {
      paint.dispose()
    }
  }

  static paintUniformBorderWithRectangle(canvas: Canvas, rect: Rect, side: BorderSide): void {
    invariant(side.style !== BorderStyle.None, 'BoxBorder.paintUniformBorderWithRectangle: side is none')
    const width = side.width
    const paint = side.toPaint()

    try {
      // Stroke is centered on the rect edge; to match at 的 deflate(width/2)
      canvas.drawRect(rectDeflate(rect, width / 2.0), paint)
    } finally {
      paint.dispose()
    }
  }

  static paintUniformBorderWithRadius(canvas: Canvas, rect: Rect, side: BorderSide, borderRadius: BorderRadius): void {
    invariant(side.style !== BorderStyle.None, 'BoxBorder.paintUniformBorderWithRadius: side is none')

    const width = side.width
    const paint = new Paint().setColor(side.color)
    const path = new Path()
    try {
      const { rx, ry } = uniformCornerRadiusXY(borderRadius)
      const outer = rect

      if (width === 0) {
        paint.setStyle(PaintStyle.Stroke).setStrokeWidth(0)
        path.raw.addRRectXY(outer, rx, ry)
        canvas.drawPath(path, paint)
        return
      }

      // Use even-odd filled path to emulate drawDRRect.
      const inner = rectDeflate(rect, width)
      const irx = Math.max(0, rx - width)
      const iry = Math.max(0, ry - width)

      path.setFillType(PathFillType.EvenOdd)
      path.raw.addRRectXY(outer, rx, ry)
      path.raw.addRRectXY(inner, irx, iry)
      paint.setStyle(PaintStyle.Fill)
      canvas.drawPath(path, paint)
    } finally {
      paint.dispose()
      path.dispose()
    }
  }

  static merge(a: BoxBorder, b: BoxBorder): BoxBorder {
    invariant(BorderSide.canMerge(a.top, b.top), 'BoxBorder.merge: top cannot merge')
    invariant(BorderSide.canMerge(a.right, b.right), 'BoxBorder.merge: right cannot merge')
    invariant(BorderSide.canMerge(a.bottom, b.bottom), 'BoxBorder.merge: bottom cannot merge')
    invariant(BorderSide.canMerge(a.left, b.left), 'BoxBorder.merge: left cannot merge')

    return new BoxBorder(
      BorderSide.merge(a.top, b.top),
      BorderSide.merge(a.right, b.right),
      BorderSide.merge(a.bottom, b.bottom),
      BorderSide.merge(a.left, b.left),
    )
  }

  static lerp(a: BoxBorder | null, b: BoxBorder | null, t: number): BoxBorder | null {
    invariant(t !== null, 'BoxBorder.lerp: t is null')

    if (a === null && b === null) return null
    if (a === null) return b!.scale(t)
    if (b === null) return a.scale(1.0 - t)

    return new BoxBorder(
      BorderSide.lerp(a.top, b.top, t),
      BorderSide.lerp(a.right, b.right, t),
      BorderSide.lerp(a.bottom, b.bottom, t),
      BorderSide.lerp(a.left, b.left, t),
    )
  }

  get dimensions(): EdgeInsetsGeometry {
    return EdgeInsets.fromLTRB(this.left.width, this.top.width, this.right.width, this.bottom.width)
  }

  get isUniform(): boolean {
    return this.colorIsUniform && this.widthIsUniform && this.styleIsUniform
  }

  get colorIsUniform(): boolean {
    const c = this.top.color
    return this.right.color === c && this.bottom.color === c && this.left.color === c
  }

  get widthIsUniform(): boolean {
    const w = this.top.width
    return this.right.width === w && this.bottom.width === w && this.left.width === w
  }

  get styleIsUniform(): boolean {
    const s = this.top.style
    return this.right.style === s && this.bottom.style === s && this.left.style === s
  }

  constructor(
    public readonly top: BorderSide = BorderSide.NONE,
    public readonly right: BorderSide = BorderSide.NONE,
    public readonly bottom: BorderSide = BorderSide.NONE,
    public readonly left: BorderSide = BorderSide.NONE,
  ) {
    super()
  }

  add(other: BoxBorder, _reversed: boolean = false): BoxBorder | null {
    if (
      other instanceof BoxBorder &&
      BorderSide.canMerge(this.top, other.top) &&
      BorderSide.canMerge(this.right, other.right) &&
      BorderSide.canMerge(this.bottom, other.bottom) &&
      BorderSide.canMerge(this.left, other.left)
    ) {
      return BoxBorder.merge(this, other)
    }

    return null
  }

  scale(t: number): BoxBorder {
    return new BoxBorder(this.top.scale(t), this.right.scale(t), this.bottom.scale(t), this.left.scale(t))
  }

  lerpFrom(a: BoxBorder | null, t: number): BoxBorder | null {
    if (a instanceof BoxBorder) return BoxBorder.lerp(a, this, t)
    return super.lerpFrom(a as any, t) as any
  }

  lerpTo(b: BoxBorder | null, t: number): BoxBorder | null {
    if (b instanceof BoxBorder) return BoxBorder.lerp(this, b, t)
    return null
  }

  getInnerPath(rect: Rect, textDirection: TextDirection = TextDirection.LTR): Path {
    const path = new Path()
    const insets = this.dimensions.resolve(textDirection)
    path.raw.addRect(deflateRectByInsets(rect, insets))
    return path
  }

  getOuterPath(rect: Rect, _textDirection: TextDirection = TextDirection.LTR): Path {
    const path = new Path()
    path.raw.addRect(rect)
    return path
  }

  paint(
    canvas: Canvas,
    rect: Rect,
    textDirection: TextDirection | null = TextDirection.LTR,
    shape: BorderShape = BorderShape.Rectangle,
    borderRadius: BorderRadius | null = null,
  ): void {
    const dir = textDirection ?? TextDirection.LTR

    if (this.isUniform) {
      switch (this.top.style) {
        case BorderStyle.None:
          return
        case BorderStyle.Solid:
        case BorderStyle.Dashed:
        case BorderStyle.Dotted: {
          switch (shape) {
            case BorderShape.Circle:
              BoxBorder.paintUniformBorderWithCircle(canvas, rect, this.top)
              return
            case BorderShape.Rectangle:
            default:
              if (borderRadius == null) {
                BoxBorder.paintUniformBorderWithRectangle(canvas, rect, this.top)
              } else {
                // 目前按统一圆角退化
                BoxBorder.paintUniformBorderWithRadius(canvas, rect, this.top, borderRadius.resolve(dir))
              }
              return
          }
        }
      }
    }

    paintBorderWithRectangle(canvas, rect, this.top, this.right, this.bottom, this.left)
  }

  eq(other: BoxBorder | null): boolean {
    return (
      other instanceof BoxBorder &&
      other.left.eq(this.left) &&
      other.top.eq(this.top) &&
      other.right.eq(this.right) &&
      other.bottom.eq(this.bottom)
    )
  }

  notEq(other: BoxBorder | null): boolean {
    return !this.eq(other)
  }
}
