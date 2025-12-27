import { Box } from './Box'

export interface RotatedBoxOptions {
  child?: Box | null
  quarterTurns?: number
}

export class RotatedBox extends Box {
  static create(options: RotatedBoxOptions = {}): RotatedBox {
    return new RotatedBox(options.child ?? null, options.quarterTurns ?? 0)
  }

  constructor(
    public child: Box | null = null,
    public quarterTurns: number = 0,
  ) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
