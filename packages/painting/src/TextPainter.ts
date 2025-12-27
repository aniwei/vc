import { InlineSpan } from './InlineSpan'
import { Size } from './Geometry'

export enum TextOverflowKind {
  Clip = 'clip',
  Ellipsis = 'ellipsis',
}

export interface TextPainterOptions {
  text: InlineSpan
  maxLines?: number | null
  ellipsis?: string | null
}

export class TextPainter {
  constructor(public readonly options: TextPainterOptions) {}

  get size(): Size {
    return Size.create(0, 0)
  }

  layout(_minWidth: number = 0, _maxWidth: number = Infinity): void {
    // stub
  }
}
