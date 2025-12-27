export interface ImageStreamListener {
  onImage(image: unknown): void
  onError?(error: unknown): void
}

export class ImageStream {
  private readonly listeners: ImageStreamListener[] = []

  addListener(listener: ImageStreamListener): void {
    this.listeners.push(listener)
  }

  removeListener(listener: ImageStreamListener): void {
    const idx = this.listeners.indexOf(listener)
    if (idx >= 0) this.listeners.splice(idx, 1)
  }
}
