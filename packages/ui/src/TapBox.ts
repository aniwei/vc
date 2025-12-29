import { Box } from './Box'

export interface TapBoxOptions {
  child?: Box | null
  onTap?: (() => void) | null
}

export class TapBox extends Box {
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
