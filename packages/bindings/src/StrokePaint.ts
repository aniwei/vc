import invariant from 'invariant'
import { StrokeCap, StrokeJoin } from './enums'
import { SharePaint } from './SharePaint'

export class StrokePaint {
  #miterLimit: number = 0
  public get miterLimit () {
    return this.#miterLimit
  }
  public set miterLimit (miterLimit: number) {
    if (this.miterLimit !== miterLimit) {
      this.#miterLimit = miterLimit
      invariant(this.#sharePaint !== null, 'StrokePaint.sharePaint is null')
      this.#sharePaint.setStrokeMiter(miterLimit)
    }
  }

  #width: number = 0
  public get width () {
    return this.#width
  }
  public set width (width: number) {
    if (this.width !== width) {
      this.#width = width
      invariant(this.#sharePaint !== null, 'StrokePaint.sharePaint is null')
      this.#sharePaint.setStrokeWidth(width)
    }
  }

  #cap: StrokeCap = StrokeCap.Butt
  public get cap () {
    return this.#cap
  }

  public set cap (cap: StrokeCap) {
    if (this.#cap !== cap) {
      this.#cap = cap
      invariant(this.#sharePaint !== null, 'StrokePaint.sharePaint is null')
      this.#sharePaint.setStrokeCap(cap)
    }
  }

  #join: StrokeJoin = StrokeJoin.Miter
  public get join () {
    return this.#join
  }

  public set join (join: StrokeJoin) {
    if (this.#join !== join) {
      this.#join = join
      invariant(this.#sharePaint !== null, 'StrokePaint.sharePaint is null')
      this.#sharePaint.setStrokeJoin(join)
    }
  }

  

  get sharePaint() {
    invariant(this.#sharePaint !== null, 'StrokePaint.sharePaint is null')
    return this.#sharePaint
  }

  set sharePaint(sharePaint: SharePaint) {
    this.#sharePaint = sharePaint
  }

  #sharePaint: SharePaint | null = null

  constructor(sharePaint?: SharePaint) {
    this.#sharePaint = sharePaint ?? null
    if (sharePaint) {
      sharePaint.retain(this)
    }
  }
}