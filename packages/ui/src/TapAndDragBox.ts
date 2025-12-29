import { TapBox, TapBoxOptions } from './TapBox'

export interface TapAndDragBoxOptions extends TapBoxOptions {}

export class TapAndDragBox extends TapBox {
  constructor(options: TapAndDragBoxOptions = {}) {
    super(options.child ?? null, options.onTap ?? null)
  }
}
