import { ShareManagedObj } from './ManagedObj'
import { PaintPtr } from './Paint'
import { StrokePaint } from './StrokePaint'

export class SharePaint extends ShareManagedObj<object, PaintPtr> {
  get raw(): number {
    return this.ptr.raw
  }

  static cloneOf (paint: SharePaint): SharePaint {
    return new SharePaint()
  }

  #stroke: StrokePaint | null = null
  public get stroke() {
    if (this.#stroke === null) {
      this.#stroke = new StrokePaint(this)
    }

    return this.#stroke
  }

  constructor () {
    super(new PaintPtr())
  }

  resurrect(): ShareManagedObj<SharePaint, PaintPtr> {
    return new ShareManagedObj<SharePaint, PaintPtr>(new PaintPtr())
  }

  setColor (argb: number) {
    this.ptr.setColor(argb)
  }

  setAntiAlias (aa: boolean) {
    this.ptr.setAntiAlias(aa)
  }

  setStyle (style: number) {
    this.ptr.setStyle(style)
  }

  setStrokeMiter (miterLimit: number) {
    this.ptr.setStrokeMiter(miterLimit)
  }

  setStrokeWidth (width: number) {
    this.ptr.setStrokeWidth(width)
  }

  setStrokeCap (cap: number) {
    this.ptr.setStrokeCap(cap)
  }

  setStrokeJoin (join: number) {
    this.ptr.setStrokeJoin(join)
  }

  setAlphaf (a: number) {
    this.ptr.setAlphaf(a)
  }
  
  setBlendMode (mode: number) {
    this.ptr.setBlendMode(mode)
  }

  setShader (shader: number) {
    this.ptr.setShader(shader)
  }

  setColorFilter (colorFilter: number) {
    this.ptr.setColorFilter(colorFilter)
  }

  setImageFilter (imageFilter: number) {
    this.ptr.setImageFilter(imageFilter)
  }

  setMaskFilter (maskFilter: number) {
    this.ptr.setMaskFilter(maskFilter)
  }

  setPathEffect (pathEffect: number) {
    this.ptr.setPathEffect(pathEffect)
  }

  delete() {
    this.ptr.delete()
  }

  isDeleted() {
    return this.ptr.isDeleted()
  }

  
}