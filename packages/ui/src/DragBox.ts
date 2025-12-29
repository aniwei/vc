import { Box } from './Box'

export interface DragBoxOptions {
  child?: Box | null
}

export class DragBox extends Box {
  constructor(public child: Box | null = null) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
