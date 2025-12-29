import { paintWithImage } from 'painting'
import { Size } from 'geometry'
import { BoxConstraints } from './Constraints'
import { Box } from './Box'
import type { Image as NativeImage } from 'bindings'
import type { PaintingContext } from './PaintingContext'

function resolveImageSize(image: NativeImage | null): Size | null {
  if (!image) return null
  return new Size(image.width, image.height)
}

export class Image extends Box {
  constructor(
    public image: NativeImage | null,
    public width: number | null = null,
    public height: number | null = null,
  ) {
    super()
  }

  override layout(constraints: BoxConstraints): void {
    this.constraints = constraints

    const intrinsic = resolveImageSize(this.image)

    let width = this.width ?? intrinsic?.width ?? 0
    let height = this.height ?? intrinsic?.height ?? 0

    if (this.width != null && this.height == null && intrinsic && intrinsic.width > 0) {
      height = (this.width * intrinsic.height) / intrinsic.width
    } else if (this.height != null && this.width == null && intrinsic && intrinsic.height > 0) {
      width = (this.height * intrinsic.width) / intrinsic.height
    }

    this.size = constraints.constrain(new Size(width, height))
    this.needsLayout = false
  }

  override paint(context: PaintingContext, offset: any): void {
    const canvas = context.canvas
    const size = this.size
    if (!canvas || !size) {
      this.needsPaint = false
      return
    }

    const image = this.image
    if (!image) {
      this.needsPaint = false
      return
    }

    const intrinsic = resolveImageSize(image)
    const iw = intrinsic?.width ?? this.width ?? size.width
    const ih = intrinsic?.height ?? this.height ?? size.height

    const rect = offset.and(size)
    // Note: bindings.Image already carries width/height and a wasm ptr.
    // iw/ih are used for layout only; painting draws the actual image object.
    paintWithImage(canvas, rect, image)

    this.needsPaint = false
  }
}
