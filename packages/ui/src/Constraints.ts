import { Size } from 'painting'

export interface BoxConstraintsOptions {
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
}

export class BoxConstraints {
  static create(options: BoxConstraintsOptions = {}): BoxConstraints {
    return new BoxConstraints(
      options.minWidth ?? 0,
      options.maxWidth ?? Number.POSITIVE_INFINITY,
      options.minHeight ?? 0,
      options.maxHeight ?? Number.POSITIVE_INFINITY,
    )
  }

  static tight(size: Size): BoxConstraints {
    return BoxConstraints.create({
      minWidth: size.width,
      maxWidth: size.width,
      minHeight: size.height,
      maxHeight: size.height,
    })
  }

  static tightFor(width: number | null = null, height: number | null = null): BoxConstraints {
    return BoxConstraints.create({
      minWidth: width ?? 0,
      maxWidth: width ?? Number.POSITIVE_INFINITY,
      minHeight: height ?? 0,
      maxHeight: height ?? Number.POSITIVE_INFINITY,
    })
  }

  static loose(size: Size): BoxConstraints {
    return BoxConstraints.create({
      minWidth: 0,
      maxWidth: size.width,
      minHeight: 0,
      maxHeight: size.height,
    })
  }

  constructor(
    public readonly minWidth: number,
    public readonly maxWidth: number,
    public readonly minHeight: number,
    public readonly maxHeight: number,
  ) {}

  get hasBoundedWidth(): boolean {
    return this.maxWidth < Number.POSITIVE_INFINITY
  }

  get hasBoundedHeight(): boolean {
    return this.maxHeight < Number.POSITIVE_INFINITY
  }

  get tight(): boolean {
    return this.minWidth >= this.maxWidth && this.minHeight >= this.maxHeight
  }

  constrainWidth(width: number = Number.POSITIVE_INFINITY): number {
    const clamped = Math.min(width, this.maxWidth)
    return Math.max(this.minWidth, clamped)
  }

  constrainHeight(height: number = Number.POSITIVE_INFINITY): number {
    const clamped = Math.min(height, this.maxHeight)
    return Math.max(this.minHeight, clamped)
  }

  constrain(size: Size): Size {
    return new Size(this.constrainWidth(size.width), this.constrainHeight(size.height))
  }
}
