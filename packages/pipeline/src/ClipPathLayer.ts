import invariant from 'invariant'
import { Clip, Mat4, Path, Rect } from 'bindings'
import { ContainerLayer } from './ContainerLayer'
import { PrerollContext } from './PrerollContext'
import { PaintContext } from './PaintContext'

// 路径裁剪层
export class ClipPathLayer extends ContainerLayer {
  public clipPath: Path
  public clipBehavior: Clip

  constructor (
    clipPath: Path,
    clipBehavior: Clip = Clip.AntiAlias
  ) {
    super()

    this.clipPath = clipPath
    this.clipBehavior = clipBehavior
  }

  preroll (context: PrerollContext, matrix: Mat4) {
    context.pushClipPath(this.clipPath)
    const childPaintBounds: Rect = this.prerollChildren(context, matrix)
    const clipBounds: Rect = this.clipPath.getBounds()

    if (childPaintBounds.overlaps(clipBounds)) {
      this.bounds = childPaintBounds.intersect(clipBounds)
    }

    context.pop()
  }

  /**
   * 
   * @param {PaintContext} context
   */  
  paint (context: PaintContext) {
    context.internal.save()
    context.internal.clipPath(this.clipPath, this.clipBehavior !== Clip.HardEdge)

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
