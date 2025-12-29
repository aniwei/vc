import invariant from 'invariant'

import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'
import { Canvas, CanvasPtr } from './Canvas'
import { Image, ImagePtr } from './Image'

function readU8Copy(ptr: number, len: number): Uint8Array {
  const heap = CanvasKitApi.heapU8()
  return heap.slice(ptr >>> 0, (ptr + len) >>> 0)
}

function encodeDataToBytes(dataPtr: number): Uint8Array {
  if (!dataPtr) return new Uint8Array()

  const bytesPtr = (CanvasKitApi.invoke('Data_bytes', dataPtr) as number) >>> 0
  const size = (CanvasKitApi.invoke('Data_size', dataPtr) as number) | 0
  const out = size > 0 ? readU8Copy(bytesPtr, size) : new Uint8Array()

  CanvasKitApi.invoke('DeleteData', dataPtr)
  return out
}

export class SurfacePtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  static makeSw(w: number, h: number): SurfacePtr {
    return new SurfacePtr(CanvasKitApi.Surface.makeSw(w | 0, h | 0))
  }

  static makeGl(w: number, h: number): SurfacePtr {
    const ptr = CanvasKitApi.Surface.makeCanvas(w | 0, h | 0)
    if (!ptr) {
      throw new Error('MakeCanvasSurface failed (WebGL/GPU surface unavailable)')
    }
    return new SurfacePtr(ptr)
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Surface.delete(this.ptr)
      this.ptr = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): SurfacePtr {
    return new SurfacePtr(this.ptr)
  }

  isAliasOf(other: any): boolean {
    return other instanceof SurfacePtr && this.ptr === other.ptr
  }

  isDeleted(): boolean {
    return this.ptr === -1
  }

  getCanvas(): Canvas {
    invariant(!this.isDeleted(), 'SurfacePtr is deleted')
    return new Canvas(new CanvasPtr(CanvasKitApi.Surface.getCanvas(this.ptr)))
  }

  makeImageSnapshot(): ImagePtr {
    invariant(!this.isDeleted(), 'SurfacePtr is deleted')
    return new ImagePtr(CanvasKitApi.Surface.makeImageSnapshot(this.ptr))
  }

  flush(): void {
    invariant(!this.isDeleted(), 'SurfacePtr is deleted')
    CanvasKitApi.Surface.flush(this.ptr)
  }

  width(): number {
    invariant(!this.isDeleted(), 'SurfacePtr is deleted')
    return CanvasKitApi.Surface.width(this.ptr) | 0
  }

  height(): number {
    invariant(!this.isDeleted(), 'SurfacePtr is deleted')
    return CanvasKitApi.Surface.height(this.ptr) | 0
  }

  readPixelsRgba8888(x: number, y: number, w: number, h: number): Uint8Array {
    invariant(!this.isDeleted(), 'SurfacePtr is deleted')

    const byteLen = (w | 0) * (h | 0) * 4
    const dst = CanvasKitApi.malloc(byteLen)

    try {
      const ok = CanvasKitApi.Surface.readPixelsRgba8888(this.ptr, x | 0, y | 0, w | 0, h | 0, dst, (w | 0) * 4)
      if (!ok) return new Uint8Array()
      return readU8Copy(dst, byteLen)
    } finally {
      CanvasKitApi.free(dst)
    }
  }

  encodeToPngBytes(): Uint8Array {
    invariant(!this.isDeleted(), 'SurfacePtr is deleted')
    const dataPtr = CanvasKitApi.Surface.encodeToPng(this.ptr)
    return encodeDataToBytes(dataPtr)
  }
}

export class Surface extends ManagedObj {
  constructor(ptr?: SurfacePtr) {
    super(ptr ?? new SurfacePtr(-1))
  }

  static makeSw(w: number, h: number): Surface {
    return new Surface(SurfacePtr.makeSw(w, h))
  }

  static makeGl(w: number, h: number): Surface {
    return new Surface(SurfacePtr.makeGl(w, h))
  }

  resurrect(): Ptr {
    throw new Error('Surface cannot be resurrected')
  }

  get raw(): SurfacePtr {
    return this.ptr as unknown as SurfacePtr
  }

  get canvas(): Canvas {
    return this.getCanvas()
  }

  getCanvas(): Canvas {
    // Canvas is non-owning; Surface owns it.
    return this.raw.getCanvas()
  }

  makeImageSnapshot(): Image {
    return new Image(this.raw.makeImageSnapshot())
  }

  flush(): this {
    this.raw.flush()
    return this
  }

  get width(): number {
    return this.raw.width()
  }

  get height(): number {
    return this.raw.height()
  }

  readPixelsRgba8888(x: number, y: number, w: number, h: number): Uint8Array {
    return this.raw.readPixelsRgba8888(x, y, w, h)
  }

  encodeToPngBytes(): Uint8Array {
    return this.raw.encodeToPngBytes()
  }

  dispose(): void {
    ;(this.ptr as unknown as SurfacePtr).deleteLater()
    super.dispose()
  }
}
