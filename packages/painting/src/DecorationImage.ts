import { ClipOp, Rect, TextDirection, Image } from 'bindings'
import invariant from 'invariant'

import { Alignment } from './Alignment'
import { BoxFit } from './BoxFit'
import type { ImageConfiguration } from './ImageProvider'
import { ImageProvider, RawImageProvider } from './ImageProvider'
import type { ImageErrorHandle, ImageInfo, ImageStream, ImageStreamListener } from './ImageStream'

import { paintWithImage } from './paintWithImage'

export enum ImageRepeat {
  NoRepeat = 'noRepeat',
  Repeat = 'repeat',
  RepeatX = 'repeatX',
  RepeatY = 'repeatY',
}

export interface DecorationImageOptions {
  image: ImageProvider | Image
  onError?: ImageErrorHandle | null
  colorFilter?: number | null
  fit?: BoxFit | null
  alignment?: Alignment
  center?: Rect | null
  repeat?: ImageRepeat
  matchTextDirection?: boolean
  scale?: number
  opacity?: number
  filterQuality?: unknown
  invertColors?: boolean
  isAntiAlias?: boolean
}

export class DecorationImage {
  public readonly image: ImageProvider
  public readonly onError: ImageErrorHandle | null
  public readonly colorFilter: number | null
  public readonly fit: BoxFit | null
  public readonly alignment: Alignment
  public readonly center: Rect | null
  public readonly repeat: ImageRepeat
  public readonly matchTextDirection: boolean
  public readonly scale: number
  public readonly opacity: number
  public readonly filterQuality: unknown
  public readonly invertColors: boolean
  public readonly isAntiAlias: boolean

  constructor(options: DecorationImageOptions) {
    invariant(!!options && typeof options === 'object', 'DecorationImage: options must be an object')
    invariant(!!(options as any).image, 'DecorationImage: options.image is required')

    const src = options.image
    this.image = src instanceof Image ? new RawImageProvider(src) : (src as ImageProvider)

    this.onError = options.onError ?? null
    this.colorFilter = options.colorFilter ?? null
    this.fit = (options.fit ?? null) as BoxFit | null
    this.alignment = options.alignment ?? Alignment.Center
    this.center = options.center ?? null
    this.repeat = options.repeat ?? ImageRepeat.NoRepeat
    this.matchTextDirection = options.matchTextDirection ?? false
    this.scale = options.scale ?? 1
    this.opacity = options.opacity ?? 1
    this.filterQuality = options.filterQuality ?? null
    this.invertColors = options.invertColors ?? false
    this.isAntiAlias = options.isAntiAlias ?? false
  }

  createPainter(onChange: VoidFunction): DecorationImagePainter {
    return new DecorationImagePainter(this, onChange)
  }
}

export class DecorationImagePainter {
  private imageInfo: ImageInfo | null = null
  private stream: ImageStream | null = null

  private readonly listener: ImageStreamListener

  constructor(
    public readonly details: DecorationImage,
    private readonly onChanged: VoidFunction,
  ) {
    this.listener = {
      onImage: this.handleImage,
      onError: (err) => (this.details.onError ?? (() => {}))(err),
    }
  }

  paint(
    canvas: any,
    rect: Rect,
    clipRect: Rect | null,
    configuration: ImageConfiguration,
  ): void {
    let flipHorizontally = false
    if (this.details.matchTextDirection) {
      const dir = configuration.textDirection ?? TextDirection.LTR
      flipHorizontally = dir === TextDirection.RTL
    }

    const stream = this.details.image.resolve(configuration)
    if (stream.key !== this.stream?.key) {
      this.stream?.removeListener(this.listener)
      this.stream = stream
      this.stream.addListener(this.listener)
    }

    if (!this.imageInfo) return

    const saved = clipRect !== null
    if (saved) {
      canvas.save()
      // bindings Canvas currently only supports clipRect.
      canvas.clipRect(clipRect!, ClipOp.Intersect, true)
    }

    paintWithImage(
      canvas,
      rect,
      this.imageInfo.image,
      this.details.scale * this.imageInfo.scale,
      this.details.opacity,
      this.details.colorFilter,
      this.details.fit,
      this.details.alignment,
      this.details.center,
      this.details.repeat,
      flipHorizontally,
      this.details.invertColors,
      this.details.filterQuality,
      this.details.isAntiAlias,
    )

    if (saved) {
      canvas.restore()
    }
  }

  private handleImage = (image: ImageInfo, synchronousCall: boolean) => {
    if (this.imageInfo && this.imageInfo.isCloneOf(image)) {
      return
    }

    this.imageInfo?.dispose()
    this.imageInfo = image

    if (!synchronousCall) {
      this.onChanged()
    }
  }

  dispose(): void {
    this.stream?.removeListener(this.listener)
    this.stream = null

    this.imageInfo?.dispose()
    this.imageInfo = null
  }
}
