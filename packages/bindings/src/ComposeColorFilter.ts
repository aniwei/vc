import { ColorFilter } from './ColorFilter'
import { ManagedColorFilter } from './ManagedColorFilter'

export class ComposeColorFilter extends ColorFilter {
  protected inner: ManagedColorFilter
  protected outer: ManagedColorFilter

  constructor (inner: ManagedColorFilter, outer: ManagedColorFilter) {
    super()

    this.inner = inner
    this.outer = outer
  }

  eq (other: ComposeColorFilter | null) {
    return (
      other instanceof ComposeColorFilter &&
      this.inner.eq(other.inner) &&
      this.outer.eq(other.outer))  
  }

  notEq (other: ComposeColorFilter | null) {
    return !this.eq(other)
  }

  toString () {
    return `ComposeColorFilter(${this.inner}, ${this.outer})`
  }

  debugDescription(): string {
    return this.toString()
  }
}