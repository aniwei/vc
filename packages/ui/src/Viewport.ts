export enum AxisDirection {
  Up = 0,
  Right = 1,
  Down = 2,
  Left = 3,
}

export enum ScrollDirection {
  Idle = 0,
  Forward = 1,
  Reverse = 2,
}

export abstract class ViewportOffset {
  static get Zero(): ViewportOffset {
    return FixedViewportOffset.Zero
  }

  static fixed(value: number): ViewportOffset {
    return new FixedViewportOffset(value)
  }

  abstract pixels: number
  abstract hasPixels: boolean

  abstract applyViewportDimension(viewportDimension: number): boolean
  abstract applyContentDimensions(minScrollExtent: number, maxScrollExtent: number): boolean

  abstract correctBy(correction: number): void
  abstract jumpTo(pixels: number): void

  abstract animateTo(to: number, duration: number): Promise<void>

  moveTo(to: number, duration: number | null): Promise<void> {
    if (duration == null || duration === 0) {
      this.jumpTo(to)
      return Promise.resolve()
    }
    return this.animateTo(to, duration)
  }

  abstract userScrollDirection: ScrollDirection
  abstract allowImplicitScrolling: boolean
}

export class FixedViewportOffset extends ViewportOffset {
  static get Zero(): FixedViewportOffset {
    return new FixedViewportOffset(0)
  }

  pixels: number

  get userScrollDirection(): ScrollDirection {
    return ScrollDirection.Idle
  }

  get hasPixels(): boolean {
    return true
  }

  get allowImplicitScrolling(): boolean {
    return false
  }

  constructor(pixels: number) {
    super()
    this.pixels = pixels
  }

  animateTo(_to: number, _duration: number): Promise<void> {
    // No animation system in this lightweight UI package.
    return Promise.resolve()
  }

  applyViewportDimension(_viewportDimension: number): boolean {
    return true
  }

  applyContentDimensions(_minScrollExtent: number, _maxScrollExtent: number): boolean {
    return true
  }

  correctBy(correction: number): void {
    this.pixels += correction
  }

  jumpTo(_pixels: number): void {
    // Fixed viewport: ignore.
  }
}
