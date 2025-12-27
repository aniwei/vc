import { Box } from './Box'

export enum FlexFit {
  Tight,
  Loose,
}

export interface FlexibleOptions {
  child?: Box | null
  flex?: number
  fit?: FlexFit
}

export class Flexible extends Box {
  static create(options: FlexibleOptions = {}): Flexible {
    return new Flexible(options.child ?? null, options.flex ?? 1, options.fit ?? FlexFit.Loose)
  }

  constructor(
    public child: Box | null = null,
    public flex: number = 1,
    public fit: FlexFit = FlexFit.Loose,
  ) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}

export class Expanded extends Flexible {
  static create(options: FlexibleOptions = {}): Expanded {
    return new Expanded(options.child ?? null, options.flex ?? 1)
  }

  constructor(child: Box | null = null, flex: number = 1) {
    super(child, flex, FlexFit.Tight)
  }
}
