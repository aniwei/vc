import { Size } from 'geometry'
import { TextDirection } from 'bindings'

export interface ViewConfigurationOptions {
  width: number
  height: number
  devicePixelRatio: number
  textDirection?: TextDirection | null
}

export class ViewConfiguration {
  static create(options: ViewConfigurationOptions): ViewConfiguration {
    return new ViewConfiguration(
      options.width,
      options.height,
      options.devicePixelRatio,
      options.textDirection ?? TextDirection.LTR,
    )
  }

  constructor(
    public width: number,
    public height: number,
    public devicePixelRatio: number,
    public textDirection: TextDirection = TextDirection.LTR,
  ) {}

  get size(): Size {
    return new Size(this.width, this.height)
  }
}
