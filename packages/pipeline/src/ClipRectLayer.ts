import { Mat4, Rect } from 'geometry'
import { Clip, ClipOp } from 'bindings'
import { ContainerLayer } from './ContainerLayer'
import { PrerollContext } from './PrerollContext'
import { PaintContext } from './PaintContext'

export class ClipRectLayer extends ContainerLayer {
  public clipRect: Rect
  public clipBehavior: Clip

  constructor (
    clipRect: Rect,
    clipBehavior: Clip = Clip.HardEdge,
  ) {
    super()
  
    this.clipRect = clipRect ?? null
    this.clipBehavior = clipBehavior
  }

  preroll (context: PrerollContext, matrix: Mat4) {
    context.pushClipRect(this.clipRect)

    const childPaintBounds: Rect = this.prerollChildren(context, matrix)

    if (childPaintBounds.overlaps(this.clipRect)) {
      this.bounds = childPaintBounds.intersect(this.clipRect)
    }

    context.pop()
  }

  paint (context: PaintContext): void {
    context.internal.save()
    context.internal.clipRect(this.clipRect, ClipOp.Intersect, this.clipBehavior !== Clip.HardEdge)

    if (this.clipBehavior === Clip.AntiAliasWithSaveLayer) {
      context.internal.saveLayer(this.clipRect, null)
    }

    this.paintChildren(context)

    if (this.clipBehavior === Clip.AntiAliasWithSaveLayer) {
      context.internal.restore()
    }

    context.internal.restore()
  }
}