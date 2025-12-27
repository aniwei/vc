import { Box } from './Box'

export interface DragBoxOptions {
  child?: Box | null
}

export class DragBox extends Box {
  static create(options: DragBoxOptions = {}): DragBox {
    return new DragBox(options.child ?? null)
  }

  constructor(public child: Box | null = null) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
