import { ColorFilter } from './ColorFilter'
import { ManagedObj, Ptr } from './ManagedObj'
import { DebugDescription, Eq } from 'shared'

export class ManagedColorFilter extends ManagedObj implements Eq<ManagedColorFilter>, DebugDescription {
  public filter: ColorFilter

  /**
   * 构造函数
   * @param {ColorFilter} filter 
   */
  constructor (filter: ColorFilter) {
    super()
    this.filter = filter
  }

  resurrect(): Ptr {
    // TODO
    throw new Error('Method not implemented.')
  }
  
  eq (other: ManagedColorFilter | null) {
    return (
      other instanceof ManagedColorFilter &&
      this.filter === other.filter)
  }

  notEq (other: ManagedColorFilter | null) {
    return !this.eq(other)
  }

  debugDescription () {
    return this.filter.toString()
  }
}