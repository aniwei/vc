import invariant from 'invariant'
import { Mat4, Offset } from 'geometry'
import { Layer } from './Layer'
import { PrerollContext } from './PrerollContext'
import { PaintContext } from './PaintContext'

export class PictureLayer extends Layer {
  #picture: Picture | null
  public get picture () {
    return this.#picture
  }
  public set picture (picture: Picture | null) {
    if (
      this.#picture === null || 
      this.#picture !== picture
    ) {
      this.#picture?.dispose()
      this.#picture = picture
    }
  }

  // => isComplexHint
  public isComplexHint: boolean = false
  public willChangeHint: boolean = false
  
  public offset: Offset = Offset.zero()

  preroll (
    context: PrerollContext, 
    matrix: Mat4
  ) {
    invariant(this.picture !== null, 'The "PictureLayer.picture" cannot be null.')
    invariant(this.picture.cullRect, 'The "PictureLayer.picture.cullRect" cannot be null.')

    this.bounds = this.picture.cullRect.shift(this.offset)
  }


  paint (context: PaintContext) {
    invariant(this.picture !== null, `The "PictureLayer.picture" cannot be null.`) 

    context.leaf.save()
    context.leaf.translate(this.offset.dx, this.offset.dy)
    context.leaf.drawPicture(this.picture)
    context.leaf.restore()
  }

  detach (): void {
    super.detach()

    this.picture?.dispose()
    this.picture = null
  }

  dispose() {
    super.dispose()
  }
}