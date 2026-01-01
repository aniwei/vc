import { DebugDescription, Eq } from 'shared'
import { ColorFilter } from './ColorFilter'
import { ManagedObj } from './ManagedObj'
import { TileMode } from './enums'


export abstract class ImageFilter extends ManagedObj implements Eq<ImageFilter>, DebugDescription {
  public get image () {
    return this
  }

  abstract eq(other: unknown): boolean
  abstract notEq(other: unknown): boolean

  toString() {
    return 'ImageFilter()'
  }

  debugDescription(): string {
    return this.toString()
  }
}


