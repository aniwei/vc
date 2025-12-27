import { Offset } from 'painting'
import { Box } from './Box'
import type { PaintingContext } from './PaintingContext'
import type { ParagraphProxy } from './ParagraphProxy'

export interface ParagraphOptions {
  proxy: ParagraphProxy
  children?: Box[]
}

export class Paragraph extends Box {
  static create(options: ParagraphOptions): Paragraph {
    return new Paragraph(options.proxy, options.children ?? [])
  }

  constructor(
    public proxy: ParagraphProxy,
    children: Box[] = [],
  ) {
    super()
    for (const child of children) {
      this.adoptChild(child)
    }
  }

  override paint(context: PaintingContext, offset: Offset): void {
    super.paint(context, offset)
  }
}
