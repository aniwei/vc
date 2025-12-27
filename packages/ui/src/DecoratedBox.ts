import { Box } from './Box'

export interface DecoratedBoxOptions {
  child?: Box | null
  decoration?: unknown
}

export class DecoratedBox extends Box {
  static create(options: DecoratedBoxOptions = {}): DecoratedBox {
    return new DecoratedBox(options.child ?? null, options.decoration ?? null)
  }

  constructor(
    public child: Box | null = null,
    public decoration: unknown | null = null,
  ) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
