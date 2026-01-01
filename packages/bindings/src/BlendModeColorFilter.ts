
import { Color } from './Color'
import { ColorFilter } from './ColorFilter'
import { BlendMode } from './enums'
import { CanvasKitApi } from './CanvasKitApi'
import type { Ptr } from './types'

export class BlendModeColorFilter extends ColorFilter {
  protected color: Color
  protected blendMode: BlendMode

  constructor (color: Color, blendMode: BlendMode) {
    super()

    this.color = color
    this.blendMode = blendMode
  }

  eq (other: BlendModeColorFilter | null) {
    return (
      other instanceof BlendModeColorFilter &&
      other.blendMode === this.blendMode &&
      other.color.eq(this.color) 
    )
  }

  notEq (other: BlendModeColorFilter | null) {
    return !this.eq(other)
  }

  createRawColorFilter(): Ptr {
    return CanvasKitApi.ColorFilter.makeBlend(this.color.value, this.blendMode)
  }

  toString () {
    return `BlendModeColorFilter(
      color: ${this.color}, 
      blendMode: ${this.blendMode})`
  }

  debugDescription(): string {
    return this.toString()
  }
}