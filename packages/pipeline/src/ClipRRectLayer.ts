import { Mat4, Rect, RRect } from 'geometry'
import { ContainerLayer } from './ContainerLayer'
import { Clip } from 'bindings'
import { PrerollContext } from './PrerollContext'
import { PaintContext } from './PaintContext'

export class ClipRRectLayer extends ContainerLayer {
  public clipRRect: RRect
  public clipBehavior: Clip

  constructor(
    clipRRect: RRect,
    clipBehavior: Clip = Clip.AntiAlias,
  ) {
    super()
    
    this.clipRRect = clipRRect ?? null
    this.clipBehavior = clipBehavior
  }

  preroll (context: PrerollContext, matrix: Mat4) {
    context.pushClipRRect(this.clipRRect)

    const childPaintBounds: Rect = this.prerollChildren(context, matrix)
    if (childPaintBounds.overlaps(this.clipRRect.outer)) {
      this.bounds = childPaintBounds.intersect(this.clipRRect.outer)
    }

    context.pop()
  }

  paint (context: PaintContext) {

    context.internal.save()
    context.internal.clipRRect(this.clipRRect, this.clipBehavior !== Clip.HardEdge)

    if (this.clipBehavior === Clip.AntiAliasWithSaveLayer) {
      context.internal.saveLayer(this.bounds, null)
    }

    this.paintChildren(context)

    if (this.clipBehavior === Clip.AntiAliasWithSaveLayer) {
      context.internal.restore()
    }

    context.internal.restore()
  }
}
