import { Box } from './Box'

export interface RepaintBoxOptions {
  child?: Box | null
}

export class RepaintBox extends Box {
  static create(options: RepaintBoxOptions = {}): RepaintBox {
    return new RepaintBox(options.child ?? null)
  }

  constructor(public child: Box | null = null) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }

  override get isRepaintBoundary(): boolean {
    return true
  }
}
