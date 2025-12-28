import invariant from 'invariant'

import { CanvasKitApi } from './CanvasKitApi'
import { Paragraph } from './Paragraph'
import { TextAlign } from './enums'

export interface ParagraphBuilderOptions {
  fontBytes: Uint8Array
  fontSize: number
  color?: number
  textAlign?: TextAlign
  maxLines?: number
  ellipsis?: string | null
}

export class ParagraphBuilder {
  static create(options: ParagraphBuilderOptions): ParagraphBuilder {
    const fontPtr = CanvasKitApi.allocBytes(options.fontBytes)
    const ellipsis = options.ellipsis
    const ellipsisBytes = ellipsis != null ? new TextEncoder().encode(ellipsis) : null
    const ellipsisPtr = ellipsisBytes ? CanvasKitApi.allocBytes(ellipsisBytes) : 0
    try {
      const builderPtr = (ellipsisBytes
        ? CanvasKitApi.ParagraphBuilder.makeWithEllipsis(
          fontPtr,
          options.fontBytes.length,
          +options.fontSize,
          (options.color ?? 0xffffffff) >>> 0,
          (options.textAlign ?? TextAlign.Start),
          (options.maxLines ?? 0) | 0,
          ellipsisPtr,
          ellipsisBytes.length,
        )
        : CanvasKitApi.ParagraphBuilder.make(
          fontPtr,
          options.fontBytes.length,
          +options.fontSize,
          (options.color ?? 0xffffffff) >>> 0,
          (options.textAlign ?? TextAlign.Start),
          (options.maxLines ?? 0) | 0,
        )) as number

      return new ParagraphBuilder(builderPtr)
    } finally {
      CanvasKitApi.free(fontPtr)
      if (ellipsisPtr) CanvasKitApi.free(ellipsisPtr)
    }
  }

  #ptr: number
  #deleted = false

  private constructor(ptr: number) {
    this.#ptr = ptr >>> 0
  }

  get ptr(): number {
    return this.#ptr
  }

  isDeleted(): boolean {
    return this.#deleted || this.#ptr === 0
  }

  pushStyle(fontSize: number, color: number): this {
    invariant(!this.isDeleted(), 'ParagraphBuilder is deleted')
    CanvasKitApi.ParagraphBuilder.pushStyle(this.#ptr, +fontSize, color >>> 0)
    return this
  }

  pop(): this {
    invariant(!this.isDeleted(), 'ParagraphBuilder is deleted')
    CanvasKitApi.ParagraphBuilder.pop(this.#ptr)
    return this
  }

  addText(text: string): this {
    invariant(!this.isDeleted(), 'ParagraphBuilder is deleted')
    if (!text) return this

    const bytes = new TextEncoder().encode(text)
    const textPtr = CanvasKitApi.allocBytes(bytes)
    try {
      CanvasKitApi.ParagraphBuilder.addText(this.#ptr, textPtr, bytes.length)
    } finally {
      CanvasKitApi.free(textPtr)
    }
    return this
  }

  build(wrapWidth: number): Paragraph {
    invariant(!this.isDeleted(), 'ParagraphBuilder is deleted')
    const paragraphPtr = CanvasKitApi.ParagraphBuilder.build(this.#ptr, +wrapWidth) as number

    if (!paragraphPtr) {
      this.#deleted = true
      this.#ptr = 0
      throw new Error('ParagraphBuilder_build returned null')
    }

    // build() consumes wasm-side builder; mark deleted on JS side too.
    this.#deleted = true
    this.#ptr = 0

    return Paragraph.fromRaw(paragraphPtr)
  }

  // Manual cleanup when you abandon building.
  dispose(): void {
    if (this.isDeleted()) return
    CanvasKitApi.ParagraphBuilder.delete(this.#ptr)
    this.#deleted = true
    this.#ptr = 0
  }
}
