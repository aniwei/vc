import { InlineSpan } from './InlineSpan'
import type { TextPaintingStyle } from './TextStyle'

export class TextSpan extends InlineSpan {
  constructor(
    public readonly text: string,
    public readonly children: InlineSpan[] = [],
    public readonly style: TextPaintingStyle | null = null,
  ) {
    super()
  }

  toPlainText(): string {
    return this.text + this.children.map((c) => c.toPlainText()).join('')
  }
}
