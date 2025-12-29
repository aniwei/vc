import { Offset } from 'geometry'
import { Box } from './Box'
import type { PaintingContext } from './PaintingContext'
import type { ParagraphProxy } from './ParagraphProxy'
import { ParagraphPainter } from './ParagraphPainter'
import type { BoxConstraints } from './Constraints'

export interface ParagraphOptions {
  proxy: ParagraphProxy
  children?: Box[]
}

export class Paragraph extends Box {
  constructor(
    public proxy: ParagraphProxy,
    children: Box[] = [],
  ) {
    super()
    this.painter = new ParagraphPainter(proxy)
    for (const child of children) {
      this.adoptChild(child)
    }
  }

  readonly painter: ParagraphPainter

  override layout(constraints: BoxConstraints): void {
    this.constraints = constraints

    const maxWidth = constraints.hasBoundedWidth 
      ? constraints.maxWidth 
      : Number.POSITIVE_INFINITY

    const w = Number.isFinite(maxWidth) ? maxWidth : 0
    const measured = this.painter.layout(w)
    
    this.size = constraints.constrain(measured)
    this.needsLayout = false
  }

  override paint(context: PaintingContext, offset: Offset): void {
    this.painter.paint(context, offset)
    this.defaultPaint(context, offset)
    this.needsPaint = false
  }
}
