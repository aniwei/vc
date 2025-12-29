import { Box } from './Box'
import type { ParagraphProxy } from './ParagraphProxy'

export interface ParagraphEditableOptions {
  proxy: ParagraphProxy
}

export class ParagraphEditable extends Box {
  constructor(public proxy: ParagraphProxy) {
    super()
  }
}
