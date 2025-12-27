export class ImageCache {
  static create(): ImageCache {
    return new ImageCache()
  }

  private readonly map = new Map<string, unknown>()

  get(key: string): unknown {
    return this.map.get(key)
  }

  set(key: string, value: unknown): void {
    this.map.set(key, value)
  }

  clear(): void {
    this.map.clear()
  }
}
