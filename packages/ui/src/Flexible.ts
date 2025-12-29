import { Box } from './Box'
import { Offset, Size } from 'geometry'
import { BoxConstraints } from './Constraints'

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
    return new Flexible(
      options.child ?? null, 
      options.flex ?? 1, 
      options.fit ?? FlexFit.Loose)
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

  override layout(constraints: BoxConstraints): void {
    this.constraints = constraints

    const child = this.child
    if (!child) {
      this.size = constraints.constrain(new Size(0, 0))
      this.needsLayout = false
      return
    }

    child.offset = Offset.ZERO

    // Flexible itself is laid out by Flex; here we only control how the
    // underlying child consumes the given constraints.
    const inner =
      this.fit === FlexFit.Tight
        ? constraints
        : BoxConstraints.create({
            minWidth: 0,
            maxWidth: constraints.maxWidth,
            minHeight: 0,
            maxHeight: constraints.maxHeight,
          })

    child.layout(inner)
    this.size = constraints.constrain(child.size ?? new Size(0, 0))
    this.needsLayout = false
  }
}

export class Expanded extends Flexible {
  static create(options: FlexibleOptions = {}): Expanded {
    return new Expanded(
      options.child ?? null, 
      options.flex ?? 1)
  }

  constructor(child: Box | null = null, flex: number = 1) {
    super(child, flex, FlexFit.Tight)
  }
}
