import invariant from 'invariant'

import { Rect, Size, Offset } from 'geometry'
import { Canvas, Paint, Path, PaintStyle, TextDirection } from 'bindings'
import { BoxBorder } from './BoxBorder'
import { BoxShadow } from './BoxShadow'
import { BorderRadius } from './BorderRadius'
import { Color } from './Color'
import { DecorationImage } from './DecorationImage'
import { Gradient } from './Gradient'
import { Decoration, BoxPainter, DecorationShape } from './Decoration'
import { DecorationCompositePainter } from './DecorationCompositePainter'
import { paintBorderWithRectangle } from './paintBorderWithRectangle'
import { BorderShape } from './Border'
import type { ImageConfiguration } from './ImageProvider'

import type { VoidCallback } from './Decoration'
import { Eq } from 'shared'

export interface BoxDecorationOptions {
  color?: number | null
  image?: DecorationImage | null
  border?: BoxBorder | null
  borderRadius?: BorderRadius | null
  shadows?: BoxShadow[] | null
  gradient?: Gradient | null
  backgroundBlendMode?: number | null
  shape?: DecorationShape | null
}

function resolveRect(offset: any, configuration: ImageConfiguration): Rect | null {
  const size = configuration.size
  
  if (!size || size.isEmpty()) {
    return null
  }
  
  const rect: Rect = offset.and(size)
  return rect.isEmpty() ? null : rect
}

function resolveDirection(configuration: ImageConfiguration): TextDirection {
  return configuration.textDirection ?? TextDirection.LTR
}

abstract class BoxDecorationLayerPainter extends BoxPainter {
  constructor(
    onChanged: VoidCallback,
    protected readonly decoration: BoxDecoration,
  ) {
    super(onChanged)
  }
}

class BoxDecorationShadowsPainter extends BoxDecorationLayerPainter {
  paint(canvas: Canvas, offset: any, configuration: ImageConfiguration): void {
    const rect = resolveRect(offset, configuration)
    if (!rect) {
      return
    }

    const { shadows, shape, borderRadius } = this.decoration.options
    if (!shadows || shadows.length === 0) {
      return
    }

    const effectiveShape = shape ?? DecorationShape.Rectangle
    const dir = resolveDirection(configuration)

    // Shadows (degraded: flat fill with offset/spread; no blur in bindings)
    for (const shadow of shadows) {
      const shadowRect = Rect.fromLTRB(
        rect.left + shadow.offset.dx - shadow.spreadRadius,
        rect.top + shadow.offset.dy - shadow.spreadRadius,
        rect.right + shadow.offset.dx + shadow.spreadRadius,
        rect.bottom + shadow.offset.dy + shadow.spreadRadius,
      )

      if (shadowRect.isEmpty()) continue

      const paint = new Paint().setStyle(PaintStyle.Fill).setColor(shadow.color >>> 0)
      try {
        if (effectiveShape === DecorationShape.Circle) {
          const cx = shadowRect.left + shadowRect.width / 2
          const cy = shadowRect.top + shadowRect.height / 2
          const radius = Math.min(shadowRect.width, shadowRect.height) / 2
          canvas.drawCircle(cx, cy, radius, paint)
        } else if (borderRadius) {
          const br = borderRadius.resolve(dir)
          const path = new Path()
          try {
            path.raw.addRRectXY(shadowRect, br.topLeft.x, br.topLeft.y)
            canvas.drawPath(path, paint)
          } finally {
            path.dispose()
          }
        } else {
          canvas.drawRect(shadowRect, paint)
        }
      } finally {
        paint.dispose()
      }
    }
  }
}

class BoxDecorationBackgroundColorPainter extends BoxDecorationLayerPainter {
  paint(canvas: Canvas, offset: any, configuration: ImageConfiguration): void {
    const rect = resolveRect(offset, configuration)
    if (!rect) {
      return
    }

    const { color, gradient, backgroundBlendMode, shape, borderRadius } = this.decoration.options
    const effectiveShape = shape ?? DecorationShape.Rectangle
    const dir = resolveDirection(configuration)

    // Background fill
    if (gradient) {
      const shader = gradient.createShader(rect)
      const paint = new Paint().setStyle(PaintStyle.Fill)
      try {
        if (backgroundBlendMode != null) {
          paint.setBlendMode(backgroundBlendMode)
        }
        paint.setShader(shader.raw.ptr)

        if (effectiveShape === DecorationShape.Circle) {
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const radius = Math.min(rect.width, rect.height) / 2
          canvas.drawCircle(cx, cy, radius, paint)
        } else if (borderRadius) {
          const br = borderRadius.resolve(dir)
          const path = new Path()
          try {
            path.raw.addRRectXY(rect, br.topLeft.x, br.topLeft.y)
            canvas.drawPath(path, paint)
          } finally {
            path.dispose()
          }
        } else {
          canvas.drawRect(rect, paint)
        }
      } finally {
        shader.dispose()
        paint.dispose()
      }
      return
    }

    if (typeof color === 'number') {
      const paint = new Paint().setStyle(PaintStyle.Fill).setColor(color >>> 0)
      try {
        if (backgroundBlendMode != null) {
          paint.setBlendMode(backgroundBlendMode)
        }

        if (effectiveShape === DecorationShape.Circle) {
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const radius = Math.min(rect.width, rect.height) / 2
          canvas.drawCircle(cx, cy, radius, paint)
        } else if (borderRadius) {
          const br = borderRadius.resolve(dir)
          const path = new Path()
          try {
            path.raw.addRRectXY(rect, br.topLeft.x, br.topLeft.y)
            canvas.drawPath(path, paint)
          } finally {
            path.dispose()
          }
        } else {
          canvas.drawRect(rect, paint)
        }
      } finally {
        paint.dispose()
      }
    }
  }
}

class BoxDecorationBackgroundImagePainter extends BoxDecorationLayerPainter {
  private imagePainter: ReturnType<DecorationImage['createPainter']> | null = null
  private lastImage: DecorationImage | null = null

  paint(canvas: Canvas, offset: any, configuration: ImageConfiguration): void {
    const rect = resolveRect(offset, configuration)
    if (!rect) return

    const { image } = this.decoration.options
    if (!image) return

    if (this.lastImage !== image) {
      this.imagePainter?.dispose()
      this.imagePainter = image.createPainter(this.onChanged)
      this.lastImage = image
    }

    // Degraded: clipPath not supported; use clipRect only.
    const clipRect = rect
    this.imagePainter?.paint(canvas as any, rect, clipRect, configuration)
  }

  override dispose(): void {
    this.imagePainter?.dispose()
    this.imagePainter = null
    this.lastImage = null
  }
}

class BoxDecorationBorderPainter extends BoxDecorationLayerPainter {
  paint(canvas: Canvas, offset: any, configuration: ImageConfiguration): void {
    const rect = resolveRect(offset, configuration)
    if (!rect) return

    const { border, borderRadius, shape } = this.decoration.options
    if (!border) return

    const effectiveShape = shape ?? DecorationShape.Rectangle
    const dir = resolveDirection(configuration)

    try {
      border.paint(
        canvas,
        rect,
        dir,
        effectiveShape === DecorationShape.Circle ? BorderShape.Circle : BorderShape.Rectangle,
        borderRadius,
      )
    } catch {
      paintBorderWithRectangle(canvas, rect, border.top, border.right, border.bottom, border.left)
    }
  }
}

class BoxDecorationCompositePainter extends DecorationCompositePainter<BoxDecoration> {
  protected createPainters(): BoxPainter[] {
    const painters: BoxPainter[] = []
    const o = this.decoration.options

    if (o.shadows && o.shadows.length > 0) {
      painters.push(new BoxDecorationShadowsPainter(this.onChanged, this.decoration))
    }

    if (o.color != null || o.gradient != null) {
      painters.push(new BoxDecorationBackgroundColorPainter(this.onChanged, this.decoration))
    }

    if (o.image != null) {
      painters.push(new BoxDecorationBackgroundImagePainter(this.onChanged, this.decoration))
    }

    if (o.border != null) {
      painters.push(new BoxDecorationBorderPainter(this.onChanged, this.decoration))
    }

    return painters
  }
}

export class BoxDecoration extends Decoration implements Eq<BoxDecoration> {
  constructor(public readonly options: BoxDecorationOptions = {}) {
    super()
  }

  get isComplex(): boolean {
    return !!(this.options.shadows && this.options.shadows.length > 0)
  }

  get padding() {
    return this.options.border ? this.options.border.dimensions : null
  }

  copyWith(patch: BoxDecorationOptions): BoxDecoration {
    return new BoxDecoration({
      color: patch.color ?? this.options.color,
      image: patch.image ?? this.options.image,
      border: patch.border ?? this.options.border,
      borderRadius: patch.borderRadius ?? this.options.borderRadius,
      shadows: patch.shadows ?? this.options.shadows,
      gradient: patch.gradient ?? this.options.gradient,
      backgroundBlendMode: patch.backgroundBlendMode ?? this.options.backgroundBlendMode,
      shape: patch.shape ?? this.options.shape,
    })
  }

  static lerp(a: BoxDecoration | null, b: BoxDecoration | null, t: number): BoxDecoration | null {
    if (a === null && b === null) return null
    if (a === null) return b!.scale(t)
    if (b === null) return a.scale(1 - t)

    const lerpNum = (x: number, y: number) => x + (y - x) * t

    const lerpColor = (ca: number | null | undefined, cb: number | null | undefined): number | null => {
      if (ca == null && cb == null) {
        return null
      }

      if (ca == null) {
        return cb!
      }

      if (cb == null) {
        return ca
      }

      return Color.lerp(ca >>> 0, cb >>> 0, t)
    }

    const lerpShadowList = (sa: BoxShadow[] | null | undefined, sb: BoxShadow[] | null | undefined): BoxShadow[] | null => {
      if (!sa && !sb) {
        return null
      }
      const aList = sa ?? []
      const bList = sb ?? []
      const out: BoxShadow[] = []
      const common = Math.min(aList.length, bList.length)
      
      for (let i = 0; i < common; i++) {
        out.push(BoxShadow.lerp(aList[i], bList[i], t)!)
      }

      for (let i = common; i < aList.length; i++) {
        out.push(aList[i].scale(1 - t))
      }
      
      for (let i = common; i < bList.length; i++) {
        out.push(bList[i].scale(t))
      }

      return out
    }

    return new BoxDecoration({
      color: lerpColor(a.options.color ?? null, b.options.color ?? null),
      image: t < 0.5 ? (a.options.image ?? null) : (b.options.image ?? null),
      border: BoxBorder.lerp(a.options.border ?? null, b.options.border ?? null, t),
      borderRadius: BorderRadius.lerp(a.options.borderRadius ?? null, b.options.borderRadius ?? null, t) as any,
      shadows: lerpShadowList(a.options.shadows ?? null, b.options.shadows ?? null),
      gradient: Gradient.lerp(a.options.gradient ?? null, b.options.gradient ?? null, t),
      backgroundBlendMode: t < 0.5 ? (a.options.backgroundBlendMode ?? null) : (b.options.backgroundBlendMode ?? null),
      shape: t < 0.5 ? (a.options.shape ?? null) : (b.options.shape ?? null),
    })
  }

  override lerpFrom(a: Decoration | null, t: number): BoxDecoration | null {
    if (a === null) {
      return this.scale(t)
    }

    if (a instanceof BoxDecoration) {
      return BoxDecoration.lerp(a, this, t)
    }

    return null
  }

  override lerpTo(b: Decoration | null, t: number): BoxDecoration | null {
    if (b === null) {
      return this.scale(1 - t)
    }
    
    if (b instanceof BoxDecoration) {
      return BoxDecoration.lerp(this, b, t)
    }

    return null
  }

  clipPath(rect: Rect, textDirection: TextDirection = TextDirection.LTR): Path {
    const shape = this.options.shape ?? DecorationShape.Rectangle
    const path = new Path()

    try {
      switch (shape) {
        case DecorationShape.Circle: {
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const radius = Math.min(rect.width, rect.height) / 2
          const square = Rect.fromLTRB(cx - radius, cy - radius, cx + radius, cy + radius)
          path.raw.addOval(square)
          break
        }
        case DecorationShape.Rectangle:
        default: {
          const borderRadius = this.options.borderRadius
          if (borderRadius) {
            const br = borderRadius.resolve(textDirection)
            path.raw.addRRectXY(rect, br.topLeft.x, br.topLeft.y)
          } else {
            path.raw.addRect(rect)
          }
          break
        }
      }
      
      return path
    } catch (e) {
      path.dispose()
      throw e
    }
  }

  override hitTest(size: Size, position: Offset, textDirection: TextDirection = TextDirection.LTR): boolean {
    if (!(size.width > 0 && size.height > 0)) {
      return false
    }
    const x = position.dx
    const y = position.dy

    if (x < 0 || y < 0 || x > size.width || y > size.height) {
      return false
    }

    const shape = this.options.shape ?? DecorationShape.Rectangle
    
    switch (shape) {
      case DecorationShape.Circle: {
        const cx = size.width / 2
        const cy = size.height / 2
        const dx = x - cx
        const dy = y - cy
        const r = Math.min(size.width, size.height) / 2
        return dx * dx + dy * dy <= r * r
      }
      case DecorationShape.Rectangle:
      default: {
        const borderRadius = this.options.borderRadius
        if (!borderRadius) return true

        // Degrade to uniform corner radius (topLeft), matching our drawPath behavior.
        const br = borderRadius.resolve(textDirection)
        const rx = Math.max(0, br.topLeft.x)
        const ry = Math.max(0, br.topLeft.y)
        if (!(rx > 0) || !(ry > 0)) return true

        const left = 0
        const top = 0
        const right = size.width
        const bottom = size.height

        // Corner ellipse test helper
        const inEllipse = (px: number, py: number, cx2: number, cy2: number) => {
          const nx = (px - cx2) / rx
          const ny = (py - cy2) / ry
          return nx * nx + ny * ny <= 1
        }

        // top-left
        if (x < left + rx && y < top + ry) return inEllipse(x, y, left + rx, top + ry)
        // top-right
        if (x > right - rx && y < top + ry) return inEllipse(x, y, right - rx, top + ry)
        // bottom-left
        if (x < left + rx && y > bottom - ry) return inEllipse(x, y, left + rx, bottom - ry)
        // bottom-right
        if (x > right - rx && y > bottom - ry) return inEllipse(x, y, right - rx, bottom - ry)

        return true
      }
    }
  }

  scale(factor: number): BoxDecoration {
    const { color, image, border, borderRadius, shadows, gradient, backgroundBlendMode, shape } = this.options
    const scaledColor = (() => {
      if (color == null) return null
      const a = (color >>> 24) & 0xff
      const scaledA = Math.max(0, Math.min(255, Math.round(a * factor)))
      return (((scaledA << 24) | (color & 0x00ffffff)) >>> 0) as number
    })()

    const scaledShadows = shadows ? shadows.map((s) => s.scale(factor)) : null

    return new BoxDecoration({
      color: scaledColor,
      image,
      border: border ? border.scale(factor) : null,
      borderRadius: borderRadius ? (borderRadius.mul(factor) as any) : null,
      shadows: scaledShadows,
      gradient: gradient ? gradient.scale(factor) : null,
      backgroundBlendMode,
      shape,
    })
  }

  eq(other: BoxDecoration | null): boolean {
    if (!(other instanceof BoxDecoration)) {
      return false
    }

    const a = this.options
    const b = other.options

    const borderEq = (a.border == null && b.border == null) || (a.border != null && a.border.eq(b.border ?? null))
    const radiusEq = (a.borderRadius == null && b.borderRadius == null) || (a.borderRadius != null && a.borderRadius.eq(b.borderRadius ?? null))

    const shadowsEq = (() => {
      const sa = a.shadows ?? null
      const sb = b.shadows ?? null
      if (sa == null && sb == null) return true
      if (sa == null || sb == null) return false
      if (sa.length !== sb.length) return false
      for (let i = 0; i < sa.length; i++) {
        if (!sa[i].eq(sb[i] ?? null)) return false
      }
      return true
    })()

    return (
      (a.color ?? null) === (b.color ?? null) &&
      (a.image ?? null) === (b.image ?? null) &&
      (a.gradient ?? null) === (b.gradient ?? null) &&
      (a.backgroundBlendMode ?? null) === (b.backgroundBlendMode ?? null) &&
      (a.shape ?? null) === (b.shape ?? null) &&
      borderEq &&
      radiusEq &&
      shadowsEq
    )
  }

  notEq(other: BoxDecoration | null): boolean {
    return !this.eq(other)
  }

  createPainter(onChanged: VoidCallback, oldPainter?: BoxPainter | null): BoxPainter {
    invariant(typeof onChanged === 'function', 'BoxDecoration.createPainter: onChanged must be a function')

    if (oldPainter instanceof BoxDecorationCompositePainter) {
      oldPainter.onChanged = onChanged
      oldPainter.updateDecoration(this)
      return oldPainter
    }

    return new BoxDecorationCompositePainter(onChanged, this)
  }
}
