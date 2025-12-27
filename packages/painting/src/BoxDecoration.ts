import { BoxBorder } from './BoxBorder'
import { BoxShadow } from './BoxShadow'
import { DecorationImage } from './DecorationImage'
import { Gradient } from './Gradient'

export interface BoxDecorationOptions {
  color?: unknown | null
  image?: DecorationImage | null
  border?: BoxBorder | null
  shadows?: BoxShadow[] | null
  gradient?: Gradient | null
}

export class BoxDecoration {
  constructor(public readonly options: BoxDecorationOptions = {}) {}
}
