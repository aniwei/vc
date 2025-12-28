import { Size } from 'geometry'
import { InlineSpan } from './InlineSpan'
import { Canvas, Paragraph, ParagraphBuilder, TextAlign } from 'bindings'
import { TextSpan } from './TextSpan'

export enum TextOverflowKind {
  Clip = 'clip',
  Ellipsis = 'ellipsis',
}

export interface TextPainterOptions {
  text: InlineSpan
  maxLines?: number | null
  ellipsis?: string | null
  overflow?: TextOverflowKind | null

  // cheap paragraph backend needs a font file in bytes.
  fontBytes: Uint8Array
  fontSize?: number
  color?: number
  textAlign?: TextAlign
}

export class TextPainter {
  constructor(public readonly options: TextPainterOptions) {}

  #paragraph: Paragraph | null = null
  #size: Size = new Size(0, 0)

  #maxLinesOverride: number | null | undefined = undefined
  #ellipsisOverride: string | null | undefined = undefined
  #overflowOverride: TextOverflowKind | null | undefined = undefined

  get maxLines(): number | null {
    return this.#maxLinesOverride !== undefined ? this.#maxLinesOverride : (this.options.maxLines ?? null)
  }

  set maxLines(value: number | null) {
    if (this.#maxLinesOverride === value) return
    this.#maxLinesOverride = value
    this.#paragraph?.dispose()
    this.#paragraph = null
  }

  get ellipsis(): string | null {
    return this.#ellipsisOverride !== undefined ? this.#ellipsisOverride : (this.options.ellipsis ?? null)
  }

  set ellipsis(value: string | null) {
    if (this.#ellipsisOverride === value) return
    this.#ellipsisOverride = value
    this.#paragraph?.dispose()
    this.#paragraph = null
  }

  get overflow(): TextOverflowKind | null {
    return this.#overflowOverride !== undefined ? this.#overflowOverride : (this.options.overflow ?? null)
  }

  set overflow(value: TextOverflowKind | null) {
    if (this.#overflowOverride === value) return
    this.#overflowOverride = value
    this.#paragraph?.dispose()
    this.#paragraph = null
  }

  get size(): Size {
    return this.#size
  }

  layout(_minWidth: number = 0, _maxWidth: number = Infinity): void {
    const maxWidth = Number.isFinite(_maxWidth) ? +_maxWidth : 0
    const text = this.options.text.toPlainText()

    const maxLinesOpt = this.#maxLinesOverride !== undefined ? this.#maxLinesOverride : this.options.maxLines
    const overflowOpt = this.#overflowOverride !== undefined ? this.#overflowOverride : this.options.overflow
    const ellipsisOpt = this.#ellipsisOverride !== undefined ? this.#ellipsisOverride : this.options.ellipsis

    const maxLines = (maxLinesOpt ?? 0) | 0
    const effectiveEllipsis = (overflowOpt != null)
      ? (overflowOpt === TextOverflowKind.Ellipsis ? (ellipsisOpt ?? '…') : null)
      : (ellipsisOpt ?? null)

    const inferredFontSize = this.options.fontSize ?? (
      this.options.text instanceof TextSpan 
        ? this.options.text.style?.fontSize 
        : undefined) ?? 14

    const inferredColor = this.options.color ?? (
      this.options.text instanceof TextSpan 
        ? this.options.text.style?.color 
        : undefined) ?? 0xffffffff

    this.#paragraph?.dispose()

    if (this.options.text instanceof TextSpan) {
      const root = this.options.text

      const builder = ParagraphBuilder.create({
        fontBytes: this.options.fontBytes,
        fontSize: inferredFontSize,
        color: inferredColor,
        textAlign: this.options.textAlign ?? TextAlign.Start,
        maxLines,
        ellipsis: effectiveEllipsis,
      })

      const visit = (span: InlineSpan, parentFontSize: number, parentColor: number): void => {
        if (!(span instanceof TextSpan)) {
          return
        }

        const ownFontSize = span.style?.fontSize ?? parentFontSize
        const ownColor = span.style?.color ?? parentColor
        const needsPush = !!span.style && (ownFontSize !== parentFontSize || ownColor !== parentColor)

        if (needsPush) {
          builder.pushStyle(ownFontSize, ownColor)
        }
        
        if (span.text) {
          builder.addText(span.text)
        }

        for (const child of span.children) {
          visit(child, ownFontSize, ownColor)
        }

        if (needsPush) {
          builder.pop()
        }
      }

      // Root uses builder base style; only add its text/children.
      if (root.text) builder.addText(root.text)
      for (const child of root.children) visit(child, inferredFontSize, inferredColor)

      this.#paragraph = builder.build(maxWidth)
    } else {
      // Fallback: single-style paragraph.
      this.#paragraph = Paragraph.fromText(text, {
        fontBytes: this.options.fontBytes,
        fontSize: inferredFontSize,
        wrapWidth: maxWidth,
        color: inferredColor,
        textAlign: this.options.textAlign ?? TextAlign.Start,
        maxLines,
        ellipsis: effectiveEllipsis,
      })
    }

    this.#paragraph.layout(maxWidth)

    const w = this.#paragraph.longestLine
    const h = this.#paragraph.height
    this.#size = new Size(w, h)
  }

  paint(canvas: Canvas, offsetX: number, offsetY: number): void {
    if (!this.#paragraph) {
      return
    }
    
    canvas.drawParagraph(this.#paragraph.raw.ptr, offsetX, offsetY)
  }
}
