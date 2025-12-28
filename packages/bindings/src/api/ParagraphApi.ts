import { Api } from './Api'
import type { Ptr } from '../types'
import type { TextAlign } from '../enums'

export class ParagraphApi extends Api {
  makeFromText(
    utf8Ptr: Ptr,
    byteLength: number,
    fontBytesPtr: Ptr,
    fontByteLength: number,
    fontSize: number,
    wrapWidth: number,
    color: number,
    textAlign: TextAlign,
    maxLines: number,
  ): Ptr {
    return this.invoke(
      'MakeParagraphFromText',
      utf8Ptr >>> 0,
      byteLength | 0,
      fontBytesPtr >>> 0,
      fontByteLength | 0,
      +fontSize,
      +wrapWidth,
      color >>> 0,
      (textAlign as unknown as number) | 0,
      maxLines | 0,
    ) as Ptr
  }

  makeFromTextWithEllipsis(
    utf8Ptr: Ptr,
    byteLength: number,
    fontBytesPtr: Ptr,
    fontByteLength: number,
    fontSize: number,
    wrapWidth: number,
    color: number,
    textAlign: TextAlign,
    maxLines: number,
    ellipsisUtf8Ptr: Ptr,
    ellipsisByteLength: number,
  ): Ptr {
    return this.invoke(
      'MakeParagraphFromTextWithEllipsis',
      utf8Ptr >>> 0,
      byteLength | 0,
      fontBytesPtr >>> 0,
      fontByteLength | 0,
      +fontSize,
      +wrapWidth,
      color >>> 0,
      (textAlign as unknown as number) | 0,
      maxLines | 0,
      ellipsisUtf8Ptr >>> 0,
      ellipsisByteLength | 0,
    ) as Ptr
  }

  layout(paragraph: Ptr, width: number): void {
    this.invoke('Paragraph_layout', paragraph >>> 0, +width)
  }

  getHeight(paragraph: Ptr): number {
    return +this.invoke('Paragraph_getHeight', paragraph >>> 0)
  }

  getMaxWidth(paragraph: Ptr): number {
    return +this.invoke('Paragraph_getMaxWidth', paragraph >>> 0)
  }

  getMinIntrinsicWidth(paragraph: Ptr): number {
    return +this.invoke('Paragraph_getMinIntrinsicWidth', paragraph >>> 0)
  }

  getMaxIntrinsicWidth(paragraph: Ptr): number {
    return +this.invoke('Paragraph_getMaxIntrinsicWidth', paragraph >>> 0)
  }

  getLongestLine(paragraph: Ptr): number {
    return +this.invoke('Paragraph_getLongestLine', paragraph >>> 0)
  }

  delete(paragraph: Ptr): void {
    this.invoke('DeleteParagraph', paragraph >>> 0)
  }
}
