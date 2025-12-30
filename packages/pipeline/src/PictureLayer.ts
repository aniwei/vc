//// => 
// 位图层
export class PictureLayer extends Layer {
  // => picture
  protected _picture: Picture | null = null
  public get picture () {
    return this._picture
  }
  public set picture (picture: Picture | null) {
    if (
      this._picture === null || 
      this._picture !== picture
    ) {
      this._picture?.dispose()
      this._picture = picture
    }
  }

  // => isComplexHint
  public isComplexHint: boolean = false
  public willChangeHint: boolean = false
  
  public offset: Offset = Offset.zero()

  /**
   * 计算边界
   * @param {PrerollContext} context 
   * @param {Matrix4} matrix 
   */
  preroll (
    context: PrerollContext, 
    matrix: Matrix4
  ) {
    invariant(this.picture !== null, 'The "PictureLayer.picture" cannot be null.')
    invariant(this.picture.cullRect, 'The "PictureLayer.picture.cullRect" cannot be null.')

    this.bounds = this.picture.cullRect.shift(this.offset)
  }

  /**
   * 绘制
   * @param {PaintContext} context 
   */
  paint (context: PaintContext) {
    invariant(this.picture !== null, `The "PictureLayer.picture" cannot be null.`) 
    invariant(!this.ignored)

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