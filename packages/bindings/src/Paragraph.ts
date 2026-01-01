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
      CanvasKitApi.Paragraph.delete(this.raw)
      this.raw = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): ParagraphPtr {
    return new ParagraphPtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof ParagraphPtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
  }

  layout(width: number): void {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    CanvasKitApi.Paragraph.layout(this.raw, +width)
  }

  getHeight(): number {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    return CanvasKitApi.Paragraph.getHeight(this.raw)
  }

  getMaxWidth(): number {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    return CanvasKitApi.Paragraph.getMaxWidth(this.raw)
  }

  getMinIntrinsicWidth(): number {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    return CanvasKitApi.Paragraph.getMinIntrinsicWidth(this.raw)
  }

  getMaxIntrinsicWidth(): number {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    return CanvasKitApi.Paragraph.getMaxIntrinsicWidth(this.raw)
  }

  getLongestLine(): number {
    invariant(!this.isDeleted(), 'ParagraphPtr is deleted')
    return CanvasKitApi.Paragraph.getLongestLine(this.raw)
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
          ellipsisBytes.length)
        : CanvasKitApi.Paragraph.makeFromText(
          textPtr,
          textBytes.length,
          fontPtr,
          options.fontBytes.length,
          +options.fontSize,
          wrapWidth,
          color,
          textAlign,
          maxLines)) as number

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

  get ptr(): ParagraphPtr {
    return super.ptr as ParagraphPtr
  }

  resurrect(): Ptr {
    throw new Error('Paragraph cannot be resurrected')
  }

  layout(width: number): this {
    this.ptr.layout(width)
    return this
  }

  get height(): number {
    return this.ptr.getHeight()
  }

  get maxWidth(): number {
    return this.ptr.getMaxWidth()
  }

  get minIntrinsicWidth(): number {
    return this.ptr.getMinIntrinsicWidth()
  }

  get maxIntrinsicWidth(): number {
    return this.ptr.getMaxIntrinsicWidth()
  }

  get longestLine(): number {
    return this.ptr.getLongestLine()
  }

  dispose(): void {
    this.ptr.deleteLater()
    super.dispose()
  }
}
