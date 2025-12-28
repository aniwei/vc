import { Api } from './Api'
import type { Ptr } from '../types'
import type { TextAlign } from '../enums'

export class ParagraphBuilderApi extends Api {
  make(
    fontBytesPtr: Ptr,
    fontByteLength: number,
    fontSize: number,
    color: number,
    textAlign: TextAlign,
    maxLines: number,
  ): Ptr {
    return this.invoke(
      'MakeParagraphBuilder',
      fontBytesPtr >>> 0,
      fontByteLength | 0,
      +fontSize,
      color >>> 0,
      (textAlign as unknown as number) | 0,
      maxLines | 0,
    ) as Ptr
  }

  makeWithEllipsis(
    fontBytesPtr: Ptr,
    fontByteLength: number,
    fontSize: number,
    color: number,
    textAlign: TextAlign,
    maxLines: number,
    ellipsisUtf8Ptr: Ptr,
    ellipsisByteLength: number,
  ): Ptr {
    return this.invoke(
      'MakeParagraphBuilderWithEllipsis',
      fontBytesPtr >>> 0,
      fontByteLength | 0,
      +fontSize,
      color >>> 0,
      (textAlign as unknown as number) | 0,
      maxLines | 0,
      ellipsisUtf8Ptr >>> 0,
      ellipsisByteLength | 0,
    ) as Ptr
  }

  pushStyle(builder: Ptr, fontSize: number, color: number): void {
    this.invoke('ParagraphBuilder_pushStyle', builder >>> 0, +fontSize, color >>> 0)
  }

  pop(builder: Ptr): void {
    this.invoke('ParagraphBuilder_pop', builder >>> 0)
  }

  addText(builder: Ptr, utf8Ptr: Ptr, byteLength: number): void {
    this.invoke('ParagraphBuilder_addText', builder >>> 0, utf8Ptr >>> 0, byteLength | 0)
  }

  build(builder: Ptr, wrapWidth: number): Ptr {
    return this.invoke('ParagraphBuilder_build', builder >>> 0, +wrapWidth) as Ptr
  }

  delete(builder: Ptr): void {
    this.invoke('DeleteParagraphBuilder', builder >>> 0)
  }
}
