import { TapBox, TapBoxOptions } from './TapBox'
import type { DragBoxOptions } from './DragBox'

export interface TapAndDragBoxOptions extends TapBoxOptions, DragBoxOptions {}

export class TapAndDragBox extends TapBox {
  static create(options: TapAndDragBoxOptions = {}): TapAndDragBox {
    return new TapAndDragBox(options)
  }

  constructor(options: TapAndDragBoxOptions = {}) {
    super(options.child ?? null, options.onTap ?? null)
  }
}
