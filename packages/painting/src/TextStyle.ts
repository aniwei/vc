export interface TextPaintingStyleOptions {
  fontSize?: number
  fontFamily?: string
  // ARGB color, e.g. 0xff000000 for opaque black
  color?: number
}

export class TextPaintingStyle {
  static create(options?: TextPaintingStyleOptions): TextPaintingStyle {
    return new TextPaintingStyle(options?.fontSize, options?.fontFamily, options?.color)
  }

  constructor(
    public readonly fontSize: number | undefined,
    public readonly fontFamily: string | undefined,
    public readonly color: number | undefined,
  ) {}

  equal(other: TextPaintingStyle | null): boolean {
    return (
      !!other &&
      other.fontSize === this.fontSize &&
      other.fontFamily === this.fontFamily &&
      other.color === this.color
    )
  }

  notEqual(other: TextPaintingStyle | null): boolean {
    return !this.equal(other)
  }
}
