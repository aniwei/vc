import invariant from 'invariant'

import { Image, Size, TextDirection } from 'bindings'

import { ImageCache } from './ImageCache'
import { ImageInfo, ImageStream } from './ImageStream'

export interface ImageConfigurationOptions {
  devicePixelRatio?: number | null
  size?: Size | null
  textDirection?: TextDirection | null
}

export class ImageConfiguration {
  constructor(
    public readonly devicePixelRatio: number | null = 2.0,
    public readonly size: Size | null = null,
    public readonly textDirection: TextDirection | null = null,
  ) {}
}

const sharedImageCache = ImageCache.create()

export abstract class ImageProvider {
  abstract obtainKey(configuration: ImageConfiguration): unknown

  abstract load(key: unknown, configuration: ImageConfiguration): Promise<ImageInfo>

  resolve(configuration: ImageConfiguration): ImageStream {
    invariant(configuration instanceof ImageConfiguration, 'ImageProvider.resolve: configuration must be ImageConfiguration')

    const key = this.obtainKey(configuration)
    const stream = new ImageStream(key)

    const cached = sharedImageCache.get(String(key)) as ImageInfo | undefined
    if (cached) {
      stream.setImage(cached, true)
      return stream
    }

    this.load(key, configuration)
      .then((info) => {
        sharedImageCache.set(String(key), info)
        stream.setImage(info, false)
      })
      .catch((err) => stream.reportError(err))

    return stream
  }
}

export class RawImageProvider extends ImageProvider {
  constructor(
    public readonly image: Image,
    public readonly scale: number = 1.0,
  ) {
    super()
  }

  obtainKey(_configuration: ImageConfiguration): unknown {
    // Use pointer identity when available.
    const ptr = (this.image as any)?.raw?.ptr
    return ptr ? `raw:${ptr}` : this.image
  }

  load(_key: unknown, _configuration: ImageConfiguration): Promise<ImageInfo> {
    return Promise.resolve(new ImageInfo(this.image, this.scale))
  }
}
