import type { PaintingContext } from './PaintingContext'
import { Offset } from 'painting'
import type { ParagraphProxy } from './ParagraphProxy'

export interface ParagraphPainterOptions {
  proxy: ParagraphProxy
}

export class ParagraphPainter {
  static create(options: ParagraphPainterOptions): ParagraphPainter {
    return new ParagraphPainter(options.proxy)
  }

  constructor(public proxy: ParagraphProxy) {}

  paint(_context: PaintingContext, _offset: Offset): void {
    // stub
  }
}
