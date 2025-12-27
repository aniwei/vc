import { Box } from './Box'
import { Flexible } from './Flexible'

export enum Axis {
  Horizontal,
  Vertical,
}

export interface FlexOptions {
  children?: Flexible[]
  direction?: Axis
}

export class Flex extends Box {
  static create(options: FlexOptions = {}): Flex {
    return new Flex(options.children ?? [], options.direction ?? Axis.Horizontal)
  }

  constructor(
    children: Flexible[] = [],
    public direction: Axis = Axis.Horizontal,
  ) {
    super()
    for (const child of children) {
      this.adoptChild(child)
    }
  }
}

export class Row extends Flex {
  static create(options: FlexOptions = {}): Row {
    return new Row(options.children ?? [])
  }

  constructor(children: Flexible[] = []) {
    super(children, Axis.Horizontal)
  }
}

export class Column extends Flex {
  static create(options: FlexOptions = {}): Column {
    return new Column(options.children ?? [])
  }

  constructor(children: Flexible[] = []) {
    super(children, Axis.Vertical)
  }
}
