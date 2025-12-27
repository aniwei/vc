import { Box } from './Box'

export interface ContainerOptions {
  children?: Box[]
}

export class Container extends Box {
  static create(options: ContainerOptions = {}): Container {
    return new Container(options.children ?? [])
  }

  constructor(children: Box[] = []) {
    super()

    for (const child of children) {
      this.adoptChild(child)
    }
  }
}
