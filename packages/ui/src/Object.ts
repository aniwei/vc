import { Offset, Rect, Size } from 'geometry'
import { BoxConstraints } from './Constraints'
import type { PaintingContext } from './PaintingContext'
import type { PipelineOwner } from './PipelineOwner'

export class Obj {
  parent: Obj | null = null
  owner: PipelineOwner | null = null

  previousSibling: Obj | null = null
  nextSibling: Obj | null = null
  firstChild: Obj | null = null
  lastChild: Obj | null = null

  depth = 0

  needsLayout = true
  needsPaint = true

  get attached(): boolean {
    return this.owner !== null
  }

  adoptChild(child: Obj): void {
    if (child.parent) {
      child.parent.dropChild(child)
    }

    child.parent = this

    if (!this.firstChild) {
      this.firstChild = child
      this.lastChild = child
      child.previousSibling = null
      child.nextSibling = null
    } else {
      const last = this.lastChild as Obj
      last.nextSibling = child
      child.previousSibling = last
      child.nextSibling = null
      this.lastChild = child
    }

    if (this.attached) {
      child.attach(this.owner as PipelineOwner)
    }

    this.markNeedsLayout()
  }

  dropChild(child: Obj): void {
    if (child.parent !== this) {
      return
    }

    const prev = child.previousSibling
    const next = child.nextSibling

    if (prev) {
      prev.nextSibling = next
    } else {
      this.firstChild = next
    }

    if (next) {
      next.previousSibling = prev
    } else {
      this.lastChild = prev
    }

    child.parent = null
    child.previousSibling = null
    child.nextSibling = null

    if (child.attached) {
      child.detach()
    }

    this.markNeedsLayout()
  }

  attach(owner: PipelineOwner): void {
    this.owner = owner
    this.depth = this.parent ? this.parent.depth + 1 : 0

    let child = this.firstChild
    while (child) {
      child.attach(owner)
      child = child.nextSibling
    }
  }

  detach(): void {
    let child = this.firstChild
    while (child) {
      child.detach()
      child = child.nextSibling
    }
    this.owner = null
  }

  markNeedsLayout(): void {
    this.needsLayout = true
    this.parent?.markNeedsLayout()
  }

  markNeedsPaint(): void {
    this.needsPaint = true
    this.parent?.markNeedsPaint()
  }

  layout(_constraints: BoxConstraints): void {
    this.needsLayout = false
  }

  get bounds(): Rect {
    return Rect.fromLTWH(0, 0, 0, 0)
  }

  paint(_context: PaintingContext, _offset: Offset): void {
    this.needsPaint = false
  }

  paintWithContext(context: PaintingContext, offset: Offset): void {
    if (this.needsLayout) {
      return
    }
    this.paint(context, offset)
    this.needsPaint = false
  }

  reassemble(): void {
    this.markNeedsLayout()
    this.markNeedsPaint()
  }

  dispose(): void {
    let child = this.firstChild
    while (child) {
      const next = child.nextSibling
      child.dispose()
      child = next
    }
    this.firstChild = null
    this.lastChild = null
    this.parent = null
    this.owner = null
  }
}

export interface SizedObject {
  size: Size | null
}

export interface Object extends Obj {}

