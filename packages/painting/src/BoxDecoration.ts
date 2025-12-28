import invariant from 'invariant'

import { BoxBorder } from './BoxBorder'
import { BoxShadow } from './BoxShadow'
import { DecorationImage } from './DecorationImage'
import { Gradient } from './Gradient'
import { Decoration, BoxPainter } from './Decoration'
import type { VoidCallback } from './Basic'
import type { ImageConfiguration } from './ImageProvider'
import { Rect } from 'geometry'
import { Canvas, Paint } from 'bindings'
import { PaintStyle } from 'bindings'
import { Painting } from './painting'

export interface BoxDecorationOptions {
  color?: unknown | null
  image?: DecorationImage | null
  border?: BoxBorder | null
  shadows?: BoxShadow[] | null
  gradient?: Gradient | null
}

class BoxDecorationPainter extends BoxPainter {
  constructor(
    onChanged: VoidCallback,
    private readonly decoration: BoxDecoration,
  ) {
    super(onChanged)
  }

  paint(canvas: Canvas, offset: any, configuration: ImageConfiguration): void {
    const size = configuration.size
    if (!size || size.isEmpty()) return

    // Offset type comes from geometry; keep runtime compatible.
    const rect: Rect = offset.and(size)
    if (rect.isEmpty()) return

    const { color, gradient, border } = this.decoration.options

    // Background fill
    if (gradient) {
      const shader = gradient.createShader(rect)
      const paint = new Paint().setStyle(PaintStyle.Fill)

      try {
        paint.setShader(shader.raw.ptr)
        canvas.drawRect(rect, paint)
      } finally {
        shader.dispose()
        paint.dispose()
      }
    } else if (typeof color === 'number') {
      const paint = new Paint().setStyle(PaintStyle.Fill).setColor(color >>> 0)
      try {
        canvas.drawRect(rect, paint)
      } finally {
        paint.dispose()
      }
    }

    // Border
    if (border) {
      Painting.paintBorderWithRectangle(canvas, rect, border.top, border.right, border.bottom, border.left)
    }
  }
}

export class BoxDecoration extends Decoration {
  constructor(public readonly options: BoxDecorationOptions = {}) {
    super()
  }

  createPainter(onChanged: VoidCallback): BoxPainter {
    invariant(typeof onChanged === 'function', 'BoxDecoration.createPainter: onChanged must be a function')
    return new BoxDecorationPainter(onChanged, this)
  }
}
