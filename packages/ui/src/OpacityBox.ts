import { Box } from './Box'

export interface OpacityBoxOptions {
  child?: Box | null
  opacity?: number
}

export class OpacityBox extends Box {
  static create(options: OpacityBoxOptions = {}): OpacityBox {
    return new OpacityBox(options.child ?? null, options.opacity ?? 1)
  }

  constructor(
    public child: Box | null = null,
    public opacity: number = 1,
  ) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
