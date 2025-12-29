import { Box } from './Box'

export interface ContainerOptions {
  children?: Box[]
}

export class Container extends Box {
  constructor(children: Box[] = []) {
    super()

    for (const child of children) {
      this.adoptChild(child)
    }
  }
}
