import { Eq, DebugDescription } from 'shared'
import { ColorImageFilter } from './ColorImageFilter'

export enum ColorFilterKind {
  Mode,
  Matrix,
  LinearToSRGBGamma,
  SRGBToLinearGamma,
}

export abstract class ColorFilter implements Eq<ColorFilter>, DebugDescription {
  get image () {
    return new ColorImageFilter(this)
  }

  eq (other: ColorFilter | null): boolean {
    return other instanceof ColorFilter
  }

  notEq (other: ColorFilter | null): boolean {
    return !this.eq(other)
  }

  debugDescription (): string {
    return 'ColorFilter()'
  }
}

