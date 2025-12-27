import { Box } from './Box'

export interface MouseRegionBoxOptions {
  child?: Box | null
  cursor?: string | null
}

export class MouseRegionBox extends Box {
  static create(options: MouseRegionBoxOptions = {}): MouseRegionBox {
    return new MouseRegionBox(options.child ?? null, options.cursor ?? null)
  }

  constructor(
    public child: Box | null = null,
    public cursor: string | null = null,
  ) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
