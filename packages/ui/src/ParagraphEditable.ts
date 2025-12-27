import { Box } from './Box'
import type { ParagraphProxy } from './ParagraphProxy'

export interface ParagraphEditableOptions {
  proxy: ParagraphProxy
}

export class ParagraphEditable extends Box {
  static create(options: ParagraphEditableOptions): ParagraphEditable {
    return new ParagraphEditable(options.proxy)
  }

  constructor(public proxy: ParagraphProxy) {
    super()
  }
}
