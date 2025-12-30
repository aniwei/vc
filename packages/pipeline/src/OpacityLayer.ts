import invariant from 'invariant'
import { Mat4, Offset } from 'geometry'
import { Paint } from 'bindings'
import { OffsetLayer } from './OffsetLayer'
import { PrerollContext } from './PrerollContext'
import { PaintContext } from './PaintContext'

export class OpacityLayer extends OffsetLayer {
  public alpha: number
  
  constructor (
    alpha: number,
    offset: Offset  = Offset.zero(),
  ) {
    super(offset)
    
    this.alpha = alpha
  }
  
  preroll (context: PrerollContext, matrix: Mat4) {
    const childMatrix: Mat4 = Mat4.copy(matrix)
    childMatrix.translate(this.offset.dx, this.offset.dy)

    context.pushTransform(Mat4.translationValues(this.offset.dx, this.offset.dy, 0.0))
    context.pushOpacity(this.alpha)

    super.preroll(context, childMatrix)
    
    context.pop()
    context.pop()

    this.bounds = this.bounds.translate(this.offset)
  }

  paint (context: PaintContext) {
    const paint = new Paint()
    paint.color = Color.fromARGB(this.alpha, 0, 0, 0)

    context.internal.save()
    context.internal.translate(this.offset.dx, this.offset.dy)

    const saveLayerBounds = this.bounds.shift(this.offset.inverse())
    context.internal.saveLayer(saveLayerBounds, paint)
    this.paintChildren(context)
    
    context.internal.restore();
    context.internal.restore();
  }
}
