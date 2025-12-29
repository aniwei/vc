import { TextAlign } from 'bindings'
import { Offset, Size } from 'geometry'
import { TextPainter, TextSpan, TextPaintingStyle, TextOverflow } from 'painting'
import type { PaintingContext } from './PaintingContext'
import type { ParagraphProxy } from './ParagraphProxy'

export interface ParagraphPainterOptions {
  proxy: ParagraphProxy
}

export class ParagraphPainter {
  constructor(public proxy: ParagraphProxy) {}

  #painter: TextPainter | null = null
  #size: Size = new Size(0, 0)

  get size(): Size {
    return this.#size
  }

  layout(maxWidth: number): Size {
    const fontBytes = this.proxy.fontBytes
    if (!fontBytes || !fontBytes.length) {
      this.#size = new Size(0, 0)
      return this.#size
    }

    const style = TextPaintingStyle.create({
      fontSize: this.proxy.fontSize,
      color: this.proxy.color,
    })

    const span = new TextSpan(this.proxy.text ?? '', [], style)

    const painter = this.#painter ?? new TextPainter({
      text: span,
      fontBytes,
      fontSize: this.proxy.fontSize,
      color: this.proxy.color,
      textAlign: this.proxy.textAlign ?? TextAlign.Start,
      maxLines: this.proxy.maxLines,
      overflow: this.proxy.overflow ?? TextOverflow.Clip,
      ellipsis: this.proxy.ellipsis,
    })

    // Always refresh mutable knobs in case proxy changed.
    painter.maxLines = this.proxy.maxLines
    painter.overflow = this.proxy.overflow ?? TextOverflow.Clip
    painter.ellipsis = this.proxy.ellipsis

    this.#painter = painter

    painter.layout(0, maxWidth)
    this.#size = painter.size
    return this.#size
  }

  paint(context: PaintingContext, offset: Offset): void {
    const canvas = context.canvas
    const painter = this.#painter
    if (!canvas || !painter) {
      return
    }

    painter.paint(canvas, offset.dx, offset.dy)
  }
}
