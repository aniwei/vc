import invariant from 'invariant'

import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'
import { TextAlign } from './enums'

export interface ParagraphFromTextOptions {
  fontBytes: Uint8Array
  fontSize: number
  wrapWidth?: number
  color?: number
  textAlign?: TextAlign
  maxLines?: number
  ellipsis?: string | null
}

class ParagraphPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Paragraph.delete(this.ptr)
      this.ptr = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): ParagraphPtr {
    return new ParagraphPtr(this.ptr)
  }

  isAliasOf(other: any): boolean {
    return other instanceof ParagraphPtr && this.ptr === other.ptr
  }

  isDeleted(): boolean {
    return this.ptr === -1
  }

  layout(width: number): void {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    CanvasKitApi.Paragraph.layout(this.ptr, +width)
  }

  getHeight(): number {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    return CanvasKitApi.Paragraph.getHeight(this.ptr)
  }

  getMaxWidth(): number {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    return CanvasKitApi.Paragraph.getMaxWidth(this.ptr)
  }

  getMinIntrinsicWidth(): number {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    return CanvasKitApi.Paragraph.getMinIntrinsicWidth(this.ptr)
  }

  getMaxIntrinsicWidth(): number {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    return CanvasKitApi.Paragraph.getMaxIntrinsicWidth(this.ptr)
  }

  getLongestLine(): number {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    return CanvasKitApi.Paragraph.getLongestLine(this.ptr)
  }
}

export class Paragraph extends ManagedObj {
  static fromRaw(ptr: number): Paragraph {
    return new Paragraph(new ParagraphPtr(ptr >>> 0))
  }

  static fromText(text: string, options: ParagraphFromTextOptions): Paragraph {
    const enc = new TextEncoder()
    const textBytes = enc.encode(text)

    const textPtr = CanvasKitApi.allocBytes(textBytes)
    const fontPtr = CanvasKitApi.allocBytes(options.fontBytes)

    const ellipsis = options.ellipsis
    const ellipsisBytes = ellipsis != null ? enc.encode(ellipsis) : null
    const ellipsisPtr = ellipsisBytes ? CanvasKitApi.allocBytes(ellipsisBytes) : 0

    try {
      const wrapWidth = +(options.wrapWidth ?? 0)
      const color = (options.color ?? 0xffffffff) >>> 0
      const textAlign = (options.textAlign ?? TextAlign.Start)
      const maxLines = (options.maxLines ?? 0) | 0

      const p = (ellipsisBytes
        ? CanvasKitApi.Paragraph.makeFromTextWithEllipsis(
          textPtr,
          textBytes.length,
          fontPtr,
          options.fontBytes.length,
          +options.fontSize,
          wrapWidth,
          color,
          textAlign,
          maxLines,
          ellipsisPtr,
          ellipsisBytes.length,
        )
        : CanvasKitApi.Paragraph.makeFromText(
          textPtr,
          textBytes.length,
          fontPtr,
          options.fontBytes.length,
          +options.fontSize,
          wrapWidth,
          color,
          textAlign,
          maxLines,
        )) as number

      return Paragraph.fromRaw(p)
    } finally {
      CanvasKitApi.free(textPtr)
      CanvasKitApi.free(fontPtr)
      if (ellipsisPtr) CanvasKitApi.free(ellipsisPtr)
    }
  }

  constructor(ptr: ParagraphPtr) {
    super(ptr)
  }

  resurrect(): Ptr {
    throw new Error('Paragraph cannot be resurrected')
  }

  get raw(): ParagraphPtr {
    return this.ptr as unknown as ParagraphPtr
  }

  layout(width: number): this {
    this.raw.layout(width)
    return this
  }

  get height(): number {
    return this.raw.getHeight()
  }

  get maxWidth(): number {
    return this.raw.getMaxWidth()
  }

  get minIntrinsicWidth(): number {
    return this.raw.getMinIntrinsicWidth()
  }

  get maxIntrinsicWidth(): number {
    return this.raw.getMaxIntrinsicWidth()
  }

  get longestLine(): number {
    return this.raw.getLongestLine()
  }

  dispose(): void {
    ;(this.ptr as unknown as ParagraphPtr).deleteLater()
    super.dispose()
  }
}
