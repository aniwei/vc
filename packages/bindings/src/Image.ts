import invariant from 'invariant'

import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'

function readU8Copy(ptr: number, len: number): Uint8Array {
  return CanvasKitApi.getBytes(ptr >>> 0, len).slice()
}

function encodeDataToBytes(dataPtr: number): Uint8Array {
  if (!dataPtr) return new Uint8Array()

  const bytesPtr = (CanvasKitApi.invoke('Data_bytes', dataPtr) as number) >>> 0
  const size = (CanvasKitApi.invoke('Data_size', dataPtr) as number) | 0
  const out = size > 0 ? readU8Copy(bytesPtr, size) : new Uint8Array()

  CanvasKitApi.invoke('DeleteData', dataPtr)
  return out
}

export class ImagePtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  static makeFromEncodedBytes(bytes: Uint8Array): ImagePtr {
    const p = CanvasKitApi.allocBytes(bytes)

    try {
      const img = CanvasKitApi.Image.makeFromEncoded(p, bytes.length)
      return new ImagePtr(img)
    } finally {
      CanvasKitApi.free(p)
    }
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Image.delete(this.raw)
      this.raw = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): ImagePtr {
    return new ImagePtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof ImagePtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
  }

  width(): number {
    invariant(!this.isDeleted(), 'ImagePtr is deleted')
    return CanvasKitApi.Image.width(this.raw) | 0
  }

  height(): number {
    invariant(!this.isDeleted(), 'ImagePtr is deleted')
    return CanvasKitApi.Image.height(this.raw) | 0
  }

  readPixelsRgba8888(x: number, y: number, w: number, h: number): Uint8Array {
    invariant(!this.isDeleted(), 'ImagePtr is deleted')

    const byteLen = (w | 0) * (h | 0) * 4
    const dst = CanvasKitApi.malloc(byteLen)

    try {
      const ok = CanvasKitApi.Image.readPixelsRgba8888(this.raw, x | 0, y | 0, w | 0, h | 0, dst, (w | 0) * 4)
      if (!ok) return new Uint8Array()
      return readU8Copy(dst, byteLen)
    } finally {
      CanvasKitApi.free(dst)
    }
  }

  encodeToPngBytes(): Uint8Array {
    invariant(!this.isDeleted(), 'ImagePtr is deleted')
    const dataPtr = CanvasKitApi.Image.encodeToPng(this.raw)
    return encodeDataToBytes(dataPtr)
  }
}

export class Image extends ManagedObj {
  constructor(ptr?: ImagePtr) {
    super(ptr ?? new ImagePtr(-1))
  }

  static makeFromEncodedBytes(bytes: Uint8Array): Image {
    return new Image(ImagePtr.makeFromEncodedBytes(bytes))
  }

  resurrect(): Ptr {
    throw new Error('Image cannot be resurrected')
  }

  get ptr(): ImagePtr {
    return super.ptr as ImagePtr
  }

  get width(): number {
    return this.ptr.width()
  }

  get height(): number {
    return this.ptr.height()
  }

  readPixelsRgba8888(x: number, y: number, w: number, h: number): Uint8Array {
    return this.ptr.readPixelsRgba8888(x, y, w, h)
  }

  encodeToPngBytes(): Uint8Array {
    return this.ptr.encodeToPngBytes()
  }

  dispose(): void {
    ;(this.ptr as unknown as ImagePtr).deleteLater()
    super.dispose()
  }
}
