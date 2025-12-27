export interface TextPaintingStyleOptions {
  fontSize?: number
  fontFamily?: string
}

export class TextPaintingStyle {
  static create(options?: TextPaintingStyleOptions): TextPaintingStyle {
    return new TextPaintingStyle(options?.fontSize, options?.fontFamily)
  }

  constructor(
    public readonly fontSize: number | undefined,
    public readonly fontFamily: string | undefined,
  ) {}

  equal(other: TextPaintingStyle | null): boolean {
    return !!other && other.fontSize === this.fontSize && other.fontFamily === this.fontFamily
  }

  notEqual(other: TextPaintingStyle | null): boolean {
    return !this.equal(other)
  }
}
