import { Layer } from './Layer'

export class LayerHandle<T extends Layer> {
  #layer: T | null = null
  get layer () {
    return this.#layer
  }
  set layer (layer: T | null) {
    if (layer !== this.layer) {
      this.#layer?.unref()
      this.#layer = layer

      if (this.#layer !== null) {
        this.#layer?.ref()
      }
    }
  }

  dispose () {
    this.layer?.dispose()
    this.layer = null
  }
}