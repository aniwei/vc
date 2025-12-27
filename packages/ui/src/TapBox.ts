import { Box } from './Box'

export interface TapBoxOptions {
  child?: Box | null
  onTap?: (() => void) | null
}

export class TapBox extends Box {
  static create(options: TapBoxOptions = {}): TapBox {
    return new TapBox(options.child ?? null, options.onTap ?? null)
  }

  constructor(
    public child: Box | null = null,
    public onTap: (() => void) | null = null,
  ) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
