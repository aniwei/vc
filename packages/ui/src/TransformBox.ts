import { Box } from './Box'

export interface TransformBoxOptions {
  child?: Box | null
  transform?: unknown
}

export class TransformBox extends Box {
  static create(options: TransformBoxOptions = {}): TransformBox {
    return new TransformBox(options.child ?? null, options.transform ?? null)
  }

  constructor(
    public child: Box | null = null,
    public transform: unknown | null = null,
  ) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
