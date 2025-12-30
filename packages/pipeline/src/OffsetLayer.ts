import { Mat4, Offset } from 'geometry'
import { TransformLayer } from './TransformLayer'


export class OffsetLayer extends TransformLayer {
  constructor (offset: Offset = Offset.zero()) {
    super(offset, Mat4.translationValues(offset.dx, offset.dy, 0.0))
  }

  /**
     * 应用 Matrix
     * @param {Layer | null} child 
     * @param {Matrix4} transform 
     */
    applyTransform (
      child: Layer | null, 
      transform: Matrix4 
    ) {
      invariant(child !== null)
      invariant(transform !== null)
      transform.multiply(
        Matrix4.translationValues(
          this.offset.dx, 
          this.offset.dy,
          0.0
        )
      )
    }
  
    /**
     * 计算绘制边界
     * @param {PrerollContext} context 
     * @param {Matrix4} matrix 
     */
    preroll (context: PrerollContext, matrix: Matrix4) {
      invariant(this.transform !== null, 'The "Offsetlayer.transform" cannot be null.')
  
      const transform = this.transform.clone().translate(this.offset.dx, this.offset.dy)
  
      const childMatrix: Matrix4 = matrix.multiplied(transform)
      context.pushTransform(transform)
      
      const childPaintBounds: Rect = this.prerollChildren(context, childMatrix)
      this.bounds = transformRect(transform, childPaintBounds)
      
      context.pop()
    }
  
    /**
     * 绘制
     * @param {PaintContext} paintContext
     * @return {void}
     */  
    paint (context: PaintContext) {
      invariant(!this.ignored, `The layer cannot be ignored.`)
      invariant(this.transform !== null)
  
      context.internal.save()
      context.internal.transform(this.transform.clone().translate(this.offset.dx, this.offset.dy))
  
      this.paintChildren(context)
      context.internal.restore()
    }
}