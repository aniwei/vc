import invariant from 'invariant'
import { Mat4, Offset } from 'geometry'
import { ContainerLayer } from './ContainerLayer'
import { Layer } from './Layer'
import { PrerollContext } from './PrerollContext'

export class TransformLayer extends ContainerLayer {

  #offset: Offset | null = null
  get offset () {
    invariant(this.#offset, 'The property "offset" cannot be null.')
    return this.#offset
  }
  set offset (offset: Offset) {
    if (this.#offset === null || this.#offset.notEq(offset)) {
      this.#offset = offset
    }
  }

  #transform: Mat4 | null = null
  get transform () {
    invariant(this.#transform, 'The property "transform" cannot be null.')
    return this.#transform
  }
  set transform (transform: Mat4) {
    if (this.#transform === null || this.#transform.notEq(transform)) {
      this.#transform = transform
    }
  }
    
  constructor(
    offset: Offset = Offset.zero(),
    transform: Mat4,
  ) {
    super()
    this.offset = offset
    this.transform = transform
  }

  applyTransform (
    child: Layer, 
    transform: Mat4
  ) {
    invariant(transform !== null, 'The argument "transform" cannot be null.')
    transform.multiply(this.transform)
  }

  preroll (context: PrerollContext, matrix: Mat4) {
    invariant(this.transform !== null, `The layer cannot be ignored.`)
    const transform = this.transform.clone().translate(
      this.offset.dx, 
      this.offset.dy)

    const childMatrix: Mat4 = matrix.multiplied(transform)
    context.pushTransform(transform)

    const childPaintBounds: Rect = this.prerollChildren(context, childMatrix)
    this.bounds = transformRect(transform, childPaintBounds)

    context.pop()
  }

  /**
   * 绘制
   * @param {PaintContext} paintContext
   * @return {*}
   */  
  paint (context: PaintContext) {
    invariant(!this.ignored, `The layer cannot be ignored.`)
    invariant(this.transform !== null)

    context.internal.save()
    context.internal.transform(this.transform)
    this.paintChildren(context)
    context.internal.restore()
  }
}
