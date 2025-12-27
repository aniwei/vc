import { Size } from 'painting'

export interface ViewConfigurationOptions {
  width: number
  height: number
  devicePixelRatio: number
}

export class ViewConfiguration {
  static create(options: ViewConfigurationOptions): ViewConfiguration {
    return new ViewConfiguration(options.width, options.height, options.devicePixelRatio)
  }

  constructor(
    public width: number,
    public height: number,
    public devicePixelRatio: number,
  ) {}

  get size(): Size {
    return new Size(this.width, this.height)
  }
}
