

import invariant from 'invariant'
import { ManagedColorFilter } from './ManagedColorFilter'
import { SharePaint } from './SharePaint'
import { FilterQuality } from './enums'
import { Shader } from './Shader'
import { ImageFilter } from './ImageFilter'
import { MaskFilter } from './MaskFilter'



export class FilterPaint {
  #mask: MaskFilter | null = null
  get mask () {
    return this.#mask
  }
  set mask (filter: MaskFilter | null) {
    if (this.mask !== filter) {
      this.#mask = filter 
      invariant(this.#sharePaint !== null, 'FilterPaint.sharePaint is null')
      if (this.#mask !== null) {
        this.#sharePaint.setMaskFilter(this.#mask.raw)
      }
    }
  }

  #image: ImageFilter | null = null
  get image () {
    return this.#image
  }
  set image (filter: ImageFilter | null) {
    if (this.image !== filter) {
      this.#image = filter
      invariant(this.#sharePaint !== null, 'FilterPaint.sharePaint is null')
      this.#sharePaint.setImageFilter(this.image?.ptr?.raw ?? 0)
    }
  }

  #shader: Shader | null = null
  get shader () {
    return this.#shader
  }
  set shader (shader: Shader | null) {
    if (this.shader !== shader) {
      invariant(this.#sharePaint !== null, 'FilterPaint.sharePaint is null')
      this.#sharePaint.setShader(this.shader?.ptr?.raw ?? 0)
    }
  }

  #quality: FilterQuality = FilterQuality.None
  get quality () {
    return this.#quality
  }
  set quality (quality: FilterQuality) {
    if (this.quality !== quality) {
      this.#quality = quality
      if (this.shader !== null) {
        invariant(this.#sharePaint !== null, 'FilterPaint.sharePaint is null')
        this.#sharePaint.setShader(this.shader.ptr.raw)
      }
    }
  }

  #original: ManagedColorFilter | null = null
  #effective: ManagedColorFilter | null = null

  #sharePaint: SharePaint | null = null

  constructor(sharedPaint?: SharePaint) {
    if (sharedPaint) {
      sharedPaint.retain(this)
    }
  }
}
