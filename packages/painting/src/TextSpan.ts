import { InlineSpan } from './InlineSpan'

export class TextSpan extends InlineSpan {
  constructor(
    public readonly text: string,
    public readonly children: InlineSpan[] = [],
  ) {
    super()
  }

  toPlainText(): string {
    return this.text + this.children.map((c) => c.toPlainText()).join('')
  }
}
