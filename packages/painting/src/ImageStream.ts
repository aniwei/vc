import { Image } from 'bindings'

export type ImageErrorHandle = (error: unknown) => void

export class ImageInfo {
  constructor(
    public readonly image: Image,
    public readonly scale: number = 1.0,
  ) {}

  get sizeBytes(): number {
    return this.image.width * this.image.height * 4
  }

  clone(): ImageInfo {
    // bindings.Image does not currently support clone; share the reference.
    return new ImageInfo(this.image, this.scale)
  }

  isCloneOf(other: ImageInfo): boolean {
    return other.image === this.image && other.scale === this.scale
  }

  dispose(): void {
    // No-op by default: ownership is provider-dependent.
  }
}

export interface ImageStreamListener {
  onImage(image: ImageInfo, synchronousCall: boolean): void
  onError?(error: unknown): void
}

export class ImageStream {
  private readonly listeners: ImageStreamListener[] = []
  private _image: ImageInfo | null = null

  constructor(public readonly key: unknown = null) {}

  get image(): ImageInfo | null {
    return this._image
  }

  addListener(listener: ImageStreamListener): void {
    this.listeners.push(listener)
    if (this._image) {
      // Immediately notify late listeners.
      listener.onImage(this._image.clone(), true)
    }
  }

  removeListener(listener: ImageStreamListener): void {
    const idx = this.listeners.indexOf(listener)
    if (idx >= 0) this.listeners.splice(idx, 1)
  }

  setImage(image: ImageInfo, synchronousCall: boolean): void {
    this._image = image
    for (const listener of this.listeners.slice()) {
      listener.onImage(image.clone(), synchronousCall)
    }
  }

  reportError(error: unknown): void {
    for (const listener of this.listeners.slice()) {
      listener.onError?.(error)
    }
  }
}
