import { Box } from './Box'
import { FlexFit, Flexible } from './Flexible'
import { Offset, Rect, Size } from 'geometry'
import { BoxConstraints } from './Constraints'
import { Clip } from './Clip'
import type { PaintingContext } from './PaintingContext'

export enum Axis {
  Horizontal,
  Vertical,
}

export enum TextDirection {
  LTR,
  RTL,
}

export enum VerticalDirection {
  Down,
  Up,
}

export enum MainAxisSize {
  Min,
  Max,
}

export enum MainAxisAlignment {
  Start,
  End,
  Center,
  SpaceBetween,
  SpaceAround,
  SpaceEvenly,
}

export enum CrossAxisAlignment {
  Start,
  End,
  Center,
  Stretch,
}

export interface FlexOptions {
  children?: Flexible[]
  direction?: Axis
  mainAxisSize?: MainAxisSize
  mainAxisAlignment?: MainAxisAlignment
  crossAxisAlignment?: CrossAxisAlignment
  textDirection?: TextDirection
  verticalDirection?: VerticalDirection
  clipBehavior?: Clip
}

export class Flex extends Box {
  static create(options: FlexOptions = {}): Flex {
    return new Flex(
      options.children ?? [],
      options.direction ?? Axis.Horizontal,
      options.mainAxisSize ?? MainAxisSize.Max,
      options.mainAxisAlignment ?? MainAxisAlignment.Start,
      options.crossAxisAlignment ?? CrossAxisAlignment.Start,
      options.textDirection ?? TextDirection.LTR,
      options.verticalDirection ?? VerticalDirection.Down,
      options.clipBehavior ?? Clip.None,
    )
  }

  override paint(context: PaintingContext, offset: Offset): void {
    const size = this.size
    if (!size) {
      this.needsPaint = false
      return
    }

    if (this.clipBehavior === Clip.None) {
      this.defaultPaint(context, offset)
      this.needsPaint = false
      return
    }

    context.pushClipRect(
      this.needsCompositing,
      offset,
      Rect.fromLTWH(0, 0, size.width, size.height),
      (ctx, off) => this.defaultPaint(ctx, off),
      this.clipBehavior,
    )

    this.needsPaint = false
  }

  override layout(constraints: BoxConstraints): void {
    this.constraints = constraints

    const isHorizontal = this.direction === Axis.Horizontal

    const isReversedMain = isHorizontal
      ? this.textDirection === TextDirection.RTL
      : this.verticalDirection === VerticalDirection.Up

    const isReversedCross = isHorizontal
      ? this.verticalDirection === VerticalDirection.Up
      : this.textDirection === TextDirection.RTL

    const maxMain = isHorizontal ? constraints.maxWidth : constraints.maxHeight
    const hasBoundedMain = maxMain < Number.POSITIVE_INFINITY

    const maxCross = isHorizontal ? constraints.maxHeight : constraints.maxWidth
    const hasBoundedCross = maxCross < Number.POSITIVE_INFINITY

    let allocatedMain = 0
    let crossMax = 0
    let totalFlex = 0

    // Collect children in order.
    const children: Flexible[] = []
    let child = this.firstChild as Flexible | null
    
    while (child) {
      children.push(child)
      if (hasBoundedMain && child.flex > 0) {
        totalFlex += child.flex
      }
      child = child.nextSibling as Flexible | null
    }

    const crossMin = this.crossAxisAlignment === CrossAxisAlignment.Stretch && hasBoundedCross ? maxCross : 0
    const crossMaxLimit = hasBoundedCross ? maxCross : Number.POSITIVE_INFINITY

    const inflexibleConstraints = (): BoxConstraints => {
      if (isHorizontal) {
        return BoxConstraints.create({
          minWidth: 0,
          maxWidth: hasBoundedMain ? maxMain : Number.POSITIVE_INFINITY,
          minHeight: crossMin,
          maxHeight: crossMaxLimit,
        })
      }

      return BoxConstraints.create({
        minWidth: crossMin,
        maxWidth: crossMaxLimit,
        minHeight: 0,
        maxHeight: hasBoundedMain ? maxMain : Number.POSITIVE_INFINITY,
      })
    }

    // First pass: layout inflexible children (and all children if main is unbounded).
    for (const c of children) {
      if (!hasBoundedMain || c.flex <= 0 || totalFlex === 0) {
        c.offset = Offset.ZERO
        c.layout(inflexibleConstraints())
        const s = c.size ?? new Size(0, 0)
        allocatedMain += isHorizontal ? s.width : s.height
        crossMax = Math.max(crossMax, isHorizontal ? s.height : s.width)
      }
    }

    // Second pass: layout flexible children if we can flex.
    if (hasBoundedMain && totalFlex > 0) {
      const remaining = Math.max(0, maxMain - allocatedMain)

      for (const c of children) {
        if (c.flex <= 0) continue

        const portion = remaining * (c.flex / totalFlex)

        const cConstraints = isHorizontal
          ? BoxConstraints.create({
              minWidth: c.fit === FlexFit.Tight ? portion : 0,
              maxWidth: portion,
              minHeight: 0,
              maxHeight: constraints.maxHeight,
            })
          : BoxConstraints.create({
              minWidth: 0,
              maxWidth: constraints.maxWidth,
              minHeight: c.fit === FlexFit.Tight ? portion : 0,
              maxHeight: portion,
            })

        c.offset = Offset.ZERO
        c.layout(cConstraints)
        const s = c.size ?? new Size(0, 0)
        allocatedMain += isHorizontal ? s.width : s.height
        crossMax = Math.max(crossMax, isHorizontal ? s.height : s.width)
      }
    }

    // Our own size.
    const naturalMain = allocatedMain
    const finalMain =
      this.mainAxisSize === MainAxisSize.Max && hasBoundedMain
        ? maxMain
        : naturalMain

    const finalCross =
      this.crossAxisAlignment === CrossAxisAlignment.Stretch && hasBoundedCross
        ? maxCross
        : crossMax

    const finalSize = isHorizontal ? new Size(finalMain, finalCross) : new Size(finalCross, finalMain)
    this.size = constraints.constrain(finalSize)

    const actual = this.size ?? new Size(0, 0)
    const containerMain = isHorizontal ? actual.width : actual.height
    const containerCross = isHorizontal ? actual.height : actual.width

    // Position children along the main axis according to mainAxisAlignment.
    const free = Math.max(0, containerMain - naturalMain)
    const count = children.length

    let leading = 0
    let between = 0

    switch (this.mainAxisAlignment) {
      case MainAxisAlignment.Start:
        leading = 0
        between = 0
        break
      case MainAxisAlignment.End:
        leading = free
        between = 0
        break
      case MainAxisAlignment.Center:
        leading = free / 2
        between = 0
        break
      case MainAxisAlignment.SpaceBetween:
        leading = 0
        between = count > 1 ? free / (count - 1) : 0
        break
      case MainAxisAlignment.SpaceAround:
        between = count > 0 ? free / count : 0
        leading = between / 2
        break
      case MainAxisAlignment.SpaceEvenly:
        between = count > 0 ? free / (count + 1) : 0
        leading = between
        break
    }

    const crossOffsetFor = (childCross: number): number => {
      const crossAlign = (() => {
        if (!isReversedCross) return this.crossAxisAlignment

        // Reverse Start/End when cross axis is reversed.
        if (this.crossAxisAlignment === CrossAxisAlignment.Start) return CrossAxisAlignment.End
        if (this.crossAxisAlignment === CrossAxisAlignment.End) return CrossAxisAlignment.Start
        return this.crossAxisAlignment
      })()

      switch (crossAlign) {
        case CrossAxisAlignment.Start:
        case CrossAxisAlignment.Stretch:
          return 0
        case CrossAxisAlignment.End:
          return Math.max(0, containerCross - childCross)
        case CrossAxisAlignment.Center:
          return Math.max(0, (containerCross - childCross) / 2)
      }
    }

    if (!isReversedMain) {
      let mainPos = leading
      for (const c of children) {
        const s = c.size ?? new Size(0, 0)
        const childMain = isHorizontal ? s.width : s.height
        const childCross = isHorizontal ? s.height : s.width
        const crossPos = crossOffsetFor(childCross)

        c.offset = isHorizontal ? Offset.of(mainPos, crossPos) : Offset.of(crossPos, mainPos)
        mainPos += childMain + between
      }
    } else {
      let mainPos = containerMain - leading
      for (const c of children) {
        const s = c.size ?? new Size(0, 0)
        const childMain = isHorizontal ? s.width : s.height
        const childCross = isHorizontal ? s.height : s.width
        const crossPos = crossOffsetFor(childCross)

        mainPos -= childMain
        c.offset = isHorizontal ? Offset.of(mainPos, crossPos) : Offset.of(crossPos, mainPos)
        mainPos -= between
      }
    }

    this.needsLayout = false
  }

  constructor(
    children: Flexible[] = [],
    public direction: Axis = Axis.Horizontal,
    public mainAxisSize: MainAxisSize = MainAxisSize.Max,
    public mainAxisAlignment: MainAxisAlignment = MainAxisAlignment.Start,
    public crossAxisAlignment: CrossAxisAlignment = CrossAxisAlignment.Start,
    public textDirection: TextDirection = TextDirection.LTR,
    public verticalDirection: VerticalDirection = VerticalDirection.Down,
    public clipBehavior: Clip = Clip.None,
  ) {
    super()
    for (const child of children) {
      this.adoptChild(child)
    }
  }
}

export class Row extends Flex {
  static create(options: FlexOptions = {}): Row {
    const row = new Row(options.children ?? [])
    if (options.mainAxisSize != null) row.mainAxisSize = options.mainAxisSize
    if (options.mainAxisAlignment != null) row.mainAxisAlignment = options.mainAxisAlignment
    if (options.crossAxisAlignment != null) row.crossAxisAlignment = options.crossAxisAlignment
    if (options.textDirection != null) row.textDirection = options.textDirection
    if (options.verticalDirection != null) row.verticalDirection = options.verticalDirection
    if (options.clipBehavior != null) row.clipBehavior = options.clipBehavior
    return row
  }

  constructor(children: Flexible[] = []) {
    super(children, Axis.Horizontal)
  }
}

export class Column extends Flex {
  static create(options: FlexOptions = {}): Column {
    const col = new Column(options.children ?? [])
    if (options.mainAxisSize != null) col.mainAxisSize = options.mainAxisSize
    if (options.mainAxisAlignment != null) col.mainAxisAlignment = options.mainAxisAlignment
    if (options.crossAxisAlignment != null) col.crossAxisAlignment = options.crossAxisAlignment
    if (options.textDirection != null) col.textDirection = options.textDirection
    if (options.verticalDirection != null) col.verticalDirection = options.verticalDirection
    if (options.clipBehavior != null) col.clipBehavior = options.clipBehavior
    return col
  }

  constructor(children: Flexible[] = []) {
    super(children, Axis.Vertical)
  }
}
