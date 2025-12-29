import { Offset, Rect, Size } from 'geometry'
import { BoxConstraints } from './Constraints'
import { Obj } from './Object'
import type { PaintingContext } from './PaintingContext'
import type { BoxHitTestResult } from './BoxHitTest'

export class Box extends Obj {
  offset: Offset = Offset.ZERO
  size: Size | null = null
  constraints: BoxConstraints | null = null

  get isRepaintBoundary(): boolean {
    return false
  }

  get needsCompositing(): boolean {
    return false
  }

  override get bounds(): Rect {
    const size = this.size ?? new Size(0, 0)
    return Rect.fromLTWH(this.offset.dx, this.offset.dy, size.width, size.height)
  }

  override layout(constraints: BoxConstraints): void {
    this.constraints = constraints

    let child = this.firstChild as Box | null
    while (child) {
      child.layout(constraints)
      child = child.nextSibling as Box | null
    }

    if (!this.size) {
      this.size = new Size(constraints.constrainWidth(0), constraints.constrainHeight(0))
    }

    this.needsLayout = false
  }

  defaultPaint(context: PaintingContext, offset: Offset): void {
    let child = this.firstChild as Box | null
    while (child) {
      context.paintChild(child, child.offset.translate(offset.dx, offset.dy))
      child = child.nextSibling as Box | null
    }
  }

  override paint(context: PaintingContext, offset: Offset): void {
    this.defaultPaint(context, offset)
    this.needsPaint = false
  }

  hitTest(result: BoxHitTestResult, position: Offset): boolean {
    const size = this.size
    if (!size) {
      return false
    }

    if (!(size.width > 0 && size.height > 0)) {
      return false
    }

    // Local bounds check.
    if (position.dx < 0 || position.dy < 0 || position.dx > size.width || position.dy > size.height) {
      return false
    }

    // Hit test children (top-most first).
    let child = this.lastChild as Box | null
    while (child) {
      const childPos = position.translate(-child.offset.dx, -child.offset.dy)
      if (child.hitTest(result, childPos)) {
        result.add(this, position)
        return true
      }
      child = child.previousSibling as Box | null
    }

    // Hit self.
    result.add(this, position)
    return true
  }
}
