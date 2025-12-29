import { Box } from './Box'
import { Offset, Rect, Size } from 'geometry'
import { BoxConstraints } from './Constraints'
import { PositionedBox } from './PositionedBox'
import { Alignment } from './Alignment'
import { Clip } from './Clip'
import type { PaintingContext } from './PaintingContext'

export enum StackFit {
  Loose,
  Expand,
  Passthrough,
}

export interface StackBoxOptions {
  children?: Box[]
  alignment?: Alignment
  fit?: StackFit
  clipBehavior?: Clip
}

export class StackBox extends Box {
  static create(options: StackBoxOptions = {}): StackBox {
    return new StackBox(
      options.children ?? [],
      options.alignment ?? Alignment.topLeft,
      options.fit ?? StackFit.Loose,
      options.clipBehavior ?? Clip.None,
    )
  }

  #alignment: Alignment = Alignment.topLeft
  #fit: StackFit = StackFit.Loose
  #clipBehavior: Clip = Clip.None

  get clipBehavior(): Clip {
    return this.#clipBehavior
  }

  set clipBehavior(clipBehavior: Clip) {
    if (this.#clipBehavior === clipBehavior) {
      return
    }

    this.#clipBehavior = clipBehavior
    this.markNeedsPaint()
  }

  get alignment(): Alignment {
    return this.#alignment
  }

  set alignment(alignment: Alignment) {
    if (this.#alignment === alignment) {
      return
    }

    this.#alignment = alignment
    this.markNeedsLayout()
  }

  get fit(): StackFit {
    return this.#fit
  }

  set fit(fit: StackFit) {
    if (this.#fit === fit) {
      return
    }

    this.#fit = fit
    this.markNeedsLayout()
  }

  override paint(context: PaintingContext, offset: Offset): void {
    const size = this.size
    if (!size) {
      this.needsPaint = false
      return
    }

    if (this.#clipBehavior === Clip.None) {
      this.defaultPaint(context, offset)
      this.needsPaint = false
      return
    }

    context.pushClipRect(
      this.needsCompositing,
      offset,
      Rect.fromLTWH(0, 0, size.width, size.height),
      (ctx, off) => this.defaultPaint(ctx, off),
      this.#clipBehavior,
    )

    this.needsPaint = false
  }

  override layout(constraints: BoxConstraints): void {
    this.constraints = constraints

    const fit = this.#fit

    const nonPositionedConstraints =
      fit === StackFit.Passthrough
        ? constraints
        : fit === StackFit.Expand
          ? BoxConstraints.tightFor(
              constraints.hasBoundedWidth ? constraints.maxWidth : null,
              constraints.hasBoundedHeight ? constraints.maxHeight : null,
            )
          : BoxConstraints.create({
              minWidth: 0,
              maxWidth: constraints.maxWidth,
              minHeight: 0,
              maxHeight: constraints.maxHeight,
            })

    // First pass: layout non-positioned children to compute intrinsic size.
    let maxChildW = 0
    let maxChildH = 0

    let child = this.firstChild as Box | null
    while (child) {
      if (!(child instanceof PositionedBox && child.positioned)) {
        child.offset = Offset.ZERO
        child.layout(nonPositionedConstraints)
        const cs = child.size
        if (cs) {
          maxChildW = Math.max(maxChildW, cs.width)
          maxChildH = Math.max(maxChildH, cs.height)
        }
      }
      child = child.nextSibling as Box | null
    }

    // Determine our own size.
    if (constraints.tight) {
      this.size = new Size(constraints.maxWidth, constraints.maxHeight)
    } else if (fit === StackFit.Expand) {
      const w = constraints.hasBoundedWidth ? constraints.maxWidth : maxChildW
      const h = constraints.hasBoundedHeight ? constraints.maxHeight : maxChildH
      this.size = constraints.constrain(new Size(w, h))
    } else {
      this.size = constraints.constrain(new Size(maxChildW, maxChildH))
    }

    const stackSize = this.size ?? new Size(0, 0)

    const alignment = this.#alignment
    const ax = (alignment.x + 1) / 2
    const ay = (alignment.y + 1) / 2

    // Position non-positioned children according to alignment.
    child = this.firstChild as Box | null
    while (child) {
      if (!(child instanceof PositionedBox && child.positioned)) {
        const cs = child.size ?? new Size(0, 0)
        const dx = Math.max(0, stackSize.width - cs.width) * ax
        const dy = Math.max(0, stackSize.height - cs.height) * ay
        child.offset = Offset.of(dx, dy)
      }
      child = child.nextSibling as Box | null
    }

    const makePositionedConstraints = (p: PositionedBox): BoxConstraints => {
      const hasBothLR = p.left != null && p.right != null
      const hasBothTB = p.top != null && p.bottom != null

      const w = p.width ?? (hasBothLR ? Math.max(0, stackSize.width - (p.left as number) - (p.right as number)) : null)
      const h = p.height ?? (hasBothTB ? Math.max(0, stackSize.height - (p.top as number) - (p.bottom as number)) : null)

      const maxW = stackSize.width
      const maxH = stackSize.height

      if (w != null && h != null) {
        return BoxConstraints.tightFor(w, h)
      }

      if (w != null) {
        return BoxConstraints.create({ minWidth: w, maxWidth: w, minHeight: 0, maxHeight: maxH })
      }

      if (h != null) {
        return BoxConstraints.create({ minWidth: 0, maxWidth: maxW, minHeight: h, maxHeight: h })
      }

      // No explicit size: keep within the stack.
      return BoxConstraints.loose(stackSize)
    }

    // Second pass: layout and position positioned children.
    child = this.firstChild as Box | null
    while (child) {
      if (child instanceof PositionedBox && child.positioned) {
        child.layout(makePositionedConstraints(child))
        const cs = child.size ?? new Size(0, 0)

        const dx =
          child.left != null
            ? child.left
            : child.right != null
              ? stackSize.width - child.right - cs.width
              : 0

        const dy =
          child.top != null
            ? child.top
            : child.bottom != null
              ? stackSize.height - child.bottom - cs.height
              : 0

        child.offset = Offset.of(dx, dy)
      }

      child = child.nextSibling as Box | null
    }

    this.needsLayout = false
  }

  constructor(
    children: Box[] = [],
    alignment: Alignment = Alignment.topLeft,
    fit: StackFit = StackFit.Loose,
    clipBehavior: Clip = Clip.None,
  ) {
    super()

    this.#alignment = alignment
    this.#fit = fit
    this.#clipBehavior = clipBehavior

    for (const child of children) {
      this.adoptChild(child)
    }
  }
}
