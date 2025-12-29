import { Offset, Rect } from 'geometry'
import { ClipOp } from 'bindings'
import { ClipContext } from './ClipContext'
import type { Canvas } from 'bindings'
import type { Obj } from './Object'
import type { PipelineOwner } from './PipelineOwner'

export type PaintingContextCallback = (context: PaintingContext, offset: Offset) => void

export class PaintingContext extends ClipContext {
  canvas: Canvas | null = null

  constructor(
    public readonly pipeline: PipelineOwner,
    public estimatedBounds: Rect,
  ) {
    super()
  }

  paintChild(child: Obj, offset: Offset): void {
    child.paintWithContext(this, offset)
  }

  withSave(painter: VoidFunction): void {
    const canvas = this.canvas
    if (!canvas) {
      painter()
      return
    }

    canvas.save()
    try {
      painter()
    } finally {
      canvas.restore()
    }
  }

  pushClipRect(
    _needsCompositing: boolean,
    offset: Offset,
    clipRect: Rect,
    painter: PaintingContextCallback,
    _clipBehavior?: unknown,
    _oldLayer?: unknown,
  ): unknown | null {
    const canvas = this.canvas
    if (!canvas) {
      painter(this, offset)
      return null
    }

    const shifted = Rect.fromLTWH(
      clipRect.left + offset.dx,
      clipRect.top + offset.dy,
      clipRect.width,
      clipRect.height)

    this.withSave(() => {
      canvas.clipRect(shifted, ClipOp.Intersect, true)
      painter(this, offset)
    })

    return null
  }

  pushLayer(_layer: unknown, painter: PaintingContextCallback, offset: Offset): void {
    painter(this, offset)
  }
}
