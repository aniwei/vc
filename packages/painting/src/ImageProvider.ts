import { Size } from 'geometry'

export interface ImageConfigurationOptions {
  devicePixelRatio?: number | null
  size?: Size | null
}

export class ImageConfiguration {
  constructor(
    public readonly devicePixelRatio: number | null = 2.0,
    public readonly size: Size | null = null,
  ) {}
}
