import type { Imports, Ptr } from './types'
import { CanvasKitApi, type CanvasKitOptions } from './CanvasKitApi'

export interface CreateCanvasKitOptions extends CanvasKitOptions {
  wasmPath?: string
}

function makeHeapHelpers() {
  const heapU8 = () => {
    // cheap exposes a heap view for the active runner.
    // Use require() so this stays CommonJS-friendly.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheapInternal = require('@libmedia/cheap/internal') as { getHeapU8?: () => Uint8Array }
    if (typeof cheapInternal.getHeapU8 !== 'function') {
      throw new Error('cheap internal getHeapU8 not available')
    }
    return cheapInternal.getHeapU8()
  }

  const readU8Copy = (ptr: Ptr, len: number): Uint8Array => {
    const h = heapU8()
    return h.slice(ptr >>> 0, (ptr + len) >>> 0)
  }

  const writeF32Array = (ptr: Ptr, values: ArrayLike<number>): void => {
    const h = heapU8()
    const f32 = new Float32Array(h.buffer)
    const off = (ptr >>> 0) >>> 2
    for (let i = 0; i < values.length; i++) {
      f32[off + i] = +values[i]
    }
  }

  return { readU8Copy, writeF32Array }
}

export async function createCanvasKit(options: CreateCanvasKitOptions) {
  const api = await CanvasKitApi.ready({
    uri: options.uri ?? options.wasmPath,
    path: options.path,
    imports: options.imports as Imports | undefined,
  })

  const { readU8Copy, writeF32Array } = makeHeapHelpers()

  const allocMatrix = (m9: ArrayLike<number>): Ptr => {
    if (m9.length !== 9) {
      throw new Error(`allocMatrix: expected 9 floats, got ${m9.length}`)
    }
    const ptr = api.malloc(9 * 4)
    writeF32Array(ptr, m9)
    return ptr
  }

  const readSurfacePixelsRgba8888 = (surface: Ptr, w: number, h: number): Uint8Array => {
    const byteLen = (w | 0) * (h | 0) * 4
    const ptr = api.malloc(byteLen)
    try {
      const ok = api.Surface.readPixelsRgba8888(surface, 0, 0, w | 0, h | 0, ptr, (w | 0) * 4)
      if (!ok) return new Uint8Array()
      return readU8Copy(ptr, byteLen)
    } finally {
      api.free(ptr)
    }
  }

  const readImagePixelsRgba8888 = (image: Ptr, w: number, h: number): Uint8Array => {
    const byteLen = (w | 0) * (h | 0) * 4
    const ptr = api.malloc(byteLen)
    try {
      const ok = api.Image.readPixelsRgba8888(image, 0, 0, w | 0, h | 0, ptr, (w | 0) * 4)
      if (!ok) return new Uint8Array()
      return readU8Copy(ptr, byteLen)
    } finally {
      api.free(ptr)
    }
  }

  const encodeDataToBytes = (dataPtr: Ptr): Uint8Array => {
    if (!dataPtr) return new Uint8Array()
    const bytesPtr = api.invoke<number>('Data_bytes', dataPtr) >>> 0
    const size = api.invoke<number>('Data_size', dataPtr) | 0
    const out = size > 0 ? readU8Copy(bytesPtr, size) : new Uint8Array()
    api.invoke('DeleteData', dataPtr)
    return out
  }

  const encodeSurfaceToPngBytes = (surface: Ptr): Uint8Array => {
    const dataPtr = api.Surface.encodeToPng(surface)
    return encodeDataToBytes(dataPtr)
  }

  const encodeImageToPngBytes = (image: Ptr): Uint8Array => {
    const dataPtr = api.Image.encodeToPng(image)
    return encodeDataToBytes(dataPtr)
  }

  const makeImageFromEncodedBytes = (bytes: Uint8Array): Ptr => {
    const ptr = api.allocBytes(bytes)
    try {
      return api.Image.makeFromEncoded(ptr, bytes.length)
    } finally {
      api.free(ptr)
    }
  }

  const makeTypefaceFromBytes = (bytes: Uint8Array, ttcIndex: number): Ptr => {
    const ptr = api.allocBytes(bytes)
    try {
      return api.invoke('MakeTypefaceFromData', ptr, bytes.length, ttcIndex | 0)
    } finally {
      api.free(ptr)
    }
  }

  const makeTextBlobFromUtf8 = (text: string, font: Ptr): Ptr => {
    const buf = Buffer.from(text, 'utf8')
    const ptr = api.allocBytes(buf)
    try {
      // SkTextEncoding::kUTF8 is 0 in Skia.
      return api.invoke('MakeTextBlobFromText', ptr, buf.length, font, 0)
    } finally {
      api.free(ptr)
    }
  }

  return {
    runner: api.runner,
    free: api.free,
    malloc: api.malloc,
    allocBytes: api.allocBytes,
    invoke: api.invoke,

    allocMatrix,

    // Surface
    makeSwCanvasSurface: (w: number, h: number) => api.Surface.makeSw(w, h),
    deleteSurface: (surface: Ptr) => api.Surface.delete(surface),
    surfaceGetCanvas: (surface: Ptr) => api.Surface.getCanvas(surface),
    surfaceFlush: (surface: Ptr) => api.Surface.flush(surface),
    surfaceMakeImageSnapshot: (surface: Ptr) => api.Surface.makeImageSnapshot(surface),
    readSurfacePixelsRgba8888,
    encodeSurfaceToPngBytes,

    // Canvas
    canvasClear: (canvas: Ptr, argb: number) => api.Canvas.clear(canvas, argb),
    canvasDrawRect: (canvas: Ptr, l: number, t: number, r: number, b: number, paint: Ptr) =>
      api.Canvas.drawRect(canvas, l, t, r, b, paint),
    canvasDrawSkPath: (canvas: Ptr, skPath: Ptr, paint: Ptr) => api.Canvas.drawSkPath(canvas, skPath, paint),
    canvasDrawTextBlob: (canvas: Ptr, blob: Ptr, x: number, y: number, paint: Ptr) =>
      api.Canvas.drawTextBlob(canvas, blob, x, y, paint),
    canvasDrawImage: (canvas: Ptr, image: Ptr, x: number, y: number, filterMode: number, mipmapMode: number) =>
      api.Canvas.drawImage(canvas, image, x, y, filterMode, mipmapMode),
    canvasDrawImageRect: (
      canvas: Ptr,
      image: Ptr,
      srcL: number,
      srcT: number,
      srcR: number,
      srcB: number,
      dstL: number,
      dstT: number,
      dstR: number,
      dstB: number,
      filterMode: number,
      mipmapMode: number
    ) => api.Canvas.drawImageRect(canvas, image, srcL, srcT, srcR, srcB, dstL, dstT, dstR, dstB, filterMode, mipmapMode),

    // Paint
    makePaint: () => api.Paint.make(),
    deletePaint: (paint: Ptr) => api.Paint.delete(paint),
    paintSetColor: (paint: Ptr, argb: number) => api.Paint.setColor(paint, argb),
    paintSetAntiAlias: (paint: Ptr, aa: boolean) => api.Paint.setAntiAlias(paint, aa),

    // Path
    makePath: () => api.Path.make(),
    deletePath: (path: Ptr) => api.Path.delete(path),
    pathAddCircle: (path: Ptr, cx: number, cy: number, r: number) => api.Path.addCircle(path, cx, cy, r),
    pathSnapshot: (path: Ptr) => api.Path.snapshot(path),
    deleteSkPath: (skPath: Ptr) => api.Path.deleteSkPath(skPath),
    pathTransform: (skPath: Ptr, m9Ptr: Ptr) => api.Path.transform(skPath, m9Ptr),

    // Image
    makeImageFromEncodedBytes,
    deleteImage: (image: Ptr) => api.Image.delete(image),
    imageWidth: (image: Ptr) => api.Image.width(image),
    imageHeight: (image: Ptr) => api.Image.height(image),
    readImagePixelsRgba8888,
    encodeImageToPngBytes,

    // Font/Typeface/TextBlob
    makeFont: () => api.invoke('MakeFont') as Ptr,
    deleteFont: (font: Ptr) => api.invoke('DeleteFont', font),
    fontSetSize: (font: Ptr, size: number) => api.invoke('Font_setSize', font, +size),
    makeTypefaceFromBytes,
    deleteTypeface: (typeface: Ptr) => api.invoke('DeleteTypeface', typeface),
    fontSetTypeface: (font: Ptr, typeface: Ptr) => api.invoke('Font_setTypeface', font, typeface),
    makeTextBlobFromUtf8,
    deleteTextBlob: (blob: Ptr) => api.invoke('DeleteTextBlob', blob),
  }
}
