
import invariant from 'invariant'
import { Mat4, Rect } from 'geometry'
import { Node }  from './Node'
import { PrerollContext } from './PrerollContext'
import { PaintContext } from './PaintContext'
import { PipelineOwner } from './PipelineOwner'
import { Pipe } from 'stream'

//// => Layer
// 抽象层
export abstract class Layer extends Node<Layer> {
  public isEmpty () {
    return this.bounds.isEmpty
  }

  public refCount: number = 0
  public depth: number = 0
  public bounds: Rect = Rect.Zero

  public parent: Layer | null = null
  public nextSibling: Layer | null = null
  public previousSibling: Layer | null = null

  abstract preroll (context: PrerollContext, matrix: Mat4): void  
  abstract paint (context: PaintContext): void

  redepthChild (child: Layer) {
    invariant(child.owner === this.owner, 'The "child.depth" must be equal "this.owner"')

    if (child.depth <= this.depth) {
      child.depth = this.depth + 1
      child.redepthChildren()
    }
  }

  redepthChildren () {}

  adoptChild (child: Layer) {
    super.adoptChild(child)
  }

  remove () {
    
  }

  ref () {
    this.refCount += 1
  }

  unref () {
    invariant(this.refCount > 0, 'Layer reference count is already zero before unref.')
    this.refCount -= 1

    if (this.refCount === 0) {
      this.dispose()
    }
  }

  /**
   * 挂载
   * @param owner 
   */
  attach (owner: PipelineOwner) {
    this.owner = owner
  }

  /**
   * 卸载
   */
  detach () {
    this.owner = null
    this.dispose()
  }

  dispose () {
    
  }
}





//// => ColorFilterLayer
// 滤镜层
export class ColorFilterLayer extends ContainerLayer {
  static create (filter: ColorFilter) {
    return super.create(filter) as ColorFilterLayer
  }

  public filter: ColorFilter

  constructor (filter: ColorFilter) {
    super()
    this.filter = filter
  }

  paint (context: PaintContext) {
    invariant(!this.ignored, `The layer must be ignore.`)

    const paint: Paint = Paint.create()
    // TODO
    // paint.filter.color = this.filter

    context.internal.saveLayer(this.bounds, paint)
    this.paintChildren(context)
    context.internal.restore()
  }
}

//// => ImageFilterLayer
// 图片滤镜层
export class ImageFilterLayer extends ContainerLayer {
  static create (filter: Skia.ImageFilter) {
    return super.create(filter) as ImageFilterLayer
  }

  public filter: Skia.ImageFilter | null = null

  constructor (filter: Skia.ImageFilter | null) {
    super()
    this.filter = filter
  }
  
  /**
   * 绘制
   * @param {PaintContext} context 
   */
  paint (context: PaintContext) {
    invariant(!this.ignored, `The layer cannot ignore.`)
    const paint: Paint = new Paint()
    // paint.filter.image = this.filter
    
    context.internal.saveLayer(this.bounds, paint)
    this.paintChildren(context)
    context.internal.restore()
  }
}

export class OpacityLayer extends OffsetLayer {
  static create (
    alpha: number,
    offset: Offset  = Offset.ZERO,
  ) {
    return new OpacityLayer(alpha, offset)
  }

  public alpha: number
  
  constructor (
    alpha: number,
    offset: Offset  = Offset.ZERO,
  ) {
    super(offset)
    
    this.alpha = alpha
  }
  
  preroll (context: PrerollContext, matrix: Matrix4) {
    const childMatrix: Matrix4 = Matrix4.copy(matrix)
    childMatrix.translate(this.offset.dx, this.offset.dy)

    context.pushTransform(Matrix4.translationValues(this.offset.dx, this.offset.dy, 0.0))
    context.pushOpacity(this.alpha)

    super.preroll(context, childMatrix)
    
    context.pop()
    context.pop()

    this.bounds = this.bounds.translate(this.offset)
  }

  paint (context: PaintContext) {
    invariant(!this.ignored, `The layer cannot be ignore.`)

    const paint = Paint.create()
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

//// => BackdropFilterLayer
// 背景滤镜层
export class BackdropFilterLayer extends ContainerLayer {
  static create (
    filter: ImageFilter,
    blendMode: Skia.BlendMode = Engine.skia.BlendMode.SrcOver,
  ) {
    return super.create(filter, blendMode) as BackdropFilterLayer
  }
  
  public filter: ImageFilter
  public blendMode: Skia.BlendMode

  constructor (
    filter: ImageFilter,
    blendMode: Skia.BlendMode = Engine.skia.BlendMode.SrcOver,
  ) {
    super()
    this.filter = filter
    this.blendMode = blendMode
  }
  
  preroll (context: PrerollContext, matrix: Matrix4) {
    const childBounds: Rect = this.prerollChildren(context, matrix)
    this.bounds = childBounds.expandToInclude(context.cullRect)
  }

  /**
   * 绘制
   * @param {PaintContext} context
   */  
  paint (context: PaintContext) {
    const paint = new Paint()
    paint.blendMode = this.blendMode

    context.internal.saveLayerWithFilter(
      this.bounds, 
      this.filter, 
      paint
    )

    this.paintChildren(context)
    context.internal.restore()
  }
}
