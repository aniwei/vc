import { Offset, Rect, Size } from 'painting'
import { BoxConstraints } from './Constraints'
import { RenderObject } from './Object'
import type { PaintingContext } from './PaintingContext'
import type { BoxHitTestResult } from './BoxHitTest'

export class Box extends RenderObject {
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

  hitTest(_result: BoxHitTestResult, _position: Offset): boolean {
    return false
  }
}
