import { CanvasLike, LTRBRect, Offset, Rect } from 'painting'
import { ClipContext } from './ClipContext'
import type { RenderObject } from './Object'
import type { PipelineOwner } from './PipelineOwner'

export type PaintingContextCallback = (context: PaintingContext, offset: Offset) => void

export class PaintingContext extends ClipContext {
  static create(pipeline: PipelineOwner, _containerLayer: unknown, estimatedBounds: Rect): PaintingContext {
    return new PaintingContext(pipeline, estimatedBounds)
  }

  canvas: CanvasLike | null = null

  constructor(
    public readonly pipeline: PipelineOwner,
    public estimatedBounds: Rect,
  ) {
    super()
  }

  paintChild(child: RenderObject, offset: Offset): void {
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
      clipRect.height,
    )

    const ltrb: LTRBRect = [shifted.left, shifted.top, shifted.right, shifted.bottom]
    this.withSave(() => {
      canvas.clipRect(ltrb)
      painter(this, offset)
    })
    return null
  }

  pushLayer(_layer: unknown, painter: PaintingContextCallback, offset: Offset): void {
    painter(this, offset)
  }
}
