import { Box } from './Box'

export interface DetectorBoxOptions {
  child?: Box | null
}

export class DetectorBox extends Box {
  static create(options: DetectorBoxOptions = {}): DetectorBox {
    return new DetectorBox(options.child ?? null)
  }

  constructor(public child: Box | null = null) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
