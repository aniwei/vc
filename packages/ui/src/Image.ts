import { Painting, Size } from 'painting'
import { BoxConstraints } from './Constraints'
import { Box } from './Box'
import type { PaintingContext } from './PaintingContext'

type ImageWithPtrAndSize = {
  ptr: unknown
  width: number
  height: number
}

function resolveImageSize(image: unknown): Size | null {
  if (!image || typeof image !== 'object') return null

  const width = (image as any).width
  const height = (image as any).height
  if (typeof width === 'number' && typeof height === 'number') {
    return new Size(width, height)
  }

  return null
}

export class Image extends Box {
  constructor(
    public image: unknown,
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

    const intrinsic = resolveImageSize(this.image)
    const iw = intrinsic?.width ?? this.width ?? size.width
    const ih = intrinsic?.height ?? this.height ?? size.height

    const imageLike: ImageWithPtrAndSize = {
      ptr: this.image,
      width: iw,
      height: ih,
    }

    const rect = offset.and(size)
    Painting.paintWithImage(canvas, rect, imageLike)

    this.needsPaint = false
  }
}
