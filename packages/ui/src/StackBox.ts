import { Box } from './Box'

export interface StackBoxOptions {
  children?: Box[]
}

export class StackBox extends Box {
  static create(options: StackBoxOptions = {}): StackBox {
    return new StackBox(options.children ?? [])
  }

  constructor(children: Box[] = []) {
    super()
    for (const child of children) {
      this.adoptChild(child)
    }
  }
}
