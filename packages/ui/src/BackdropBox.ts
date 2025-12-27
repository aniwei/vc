import { Box } from './Box'

export interface BackdropBoxOptions {
  child?: Box | null
  filter?: unknown
  blendMode?: unknown
}

export class BackdropBox extends Box {
  static create(options: BackdropBoxOptions = {}): BackdropBox {
    return new BackdropBox(options.child ?? null, options.filter ?? null, options.blendMode ?? null)
  }

  constructor(
    public child: Box | null = null,
    public filter: unknown | null = null,
    public blendMode: unknown | null = null,
  ) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
