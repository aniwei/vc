import { Eq } from 'shared'

export interface TextPaintingStyleOptions {
  fontSize?: number
  fontFamily?: string
  color?: number
}

export class TextPaintingStyle implements Eq<TextPaintingStyle> {
  static create(options: TextPaintingStyleOptions = {}): TextPaintingStyle {
    return new TextPaintingStyle(options.fontSize, options.fontFamily, options.color)
  }

  constructor(
    public readonly fontSize: number | undefined,
    public readonly fontFamily: string | undefined,
    public readonly color: number | undefined,
  ) {}

  eq(other: TextPaintingStyle | null): boolean {
    return (
      !!other &&
      other.fontSize === this.fontSize &&
      other.fontFamily === this.fontFamily &&
      other.color === this.color)
  }

  notEq(other: TextPaintingStyle | null): boolean {
    return !this.eq(other)
  }
}
