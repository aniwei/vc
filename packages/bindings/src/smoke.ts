import fs from 'node:fs/promises'
import path from 'node:path'

import { CanvasKitApi } from './CanvasKitApi'

function readU8Copy(ptr: number, len: number): Uint8Array {
  return CanvasKitApi.getBytes(ptr >>> 0, len).slice()
}

function writeF32Array(ptr: number, values: ArrayLike<number>): void {
  CanvasKitApi.setFloat32Array(ptr >>> 0, values)
}

function encodeDataToBytes(dataPtr: number): Uint8Array {
  if (!dataPtr) return new Uint8Array()

  const bytesPtr = (CanvasKitApi.invoke('Data_bytes', dataPtr) as number) >>> 0
  const size = (CanvasKitApi.invoke('Data_size', dataPtr) as number) | 0
  const out = size > 0 ? readU8Copy(bytesPtr, size) : new Uint8Array()

  CanvasKitApi.invoke('DeleteData', dataPtr)
  return out
}

function getPixelRgba(rgba: Uint8Array, w: number, x: number, y: number): [number, number, number, number] {
  const off = (y * w + x) * 4
  if (off < 0 || off + 3 >= rgba.length) return [0, 0, 0, 0]
  return [rgba[off + 0]!, rgba[off + 1]!, rgba[off + 2]!, rgba[off + 3]!]
}

function isBlack([r, g, b, a]: [number, number, number, number]): boolean {
  return a === 255 && r === 0 && g === 0 && b === 0
}

function assertPngMagic(bytes: Uint8Array): void {
  const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length < magic.length) throw new Error(`expected PNG bytes, got length=${bytes.length}`)
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic[i]) throw new Error(`invalid PNG magic at ${i}: got=0x${bytes[i]!.toString(16)}`)
  }
}

function assertMostlyColor([r, g, b, a]: [number, number, number, number], want: 'red' | 'green' | 'blue'): void {
  if (want === 'red') {
    if (!(r > 200 && g < 60 && b < 60 && a === 255)) throw new Error(`expected red-ish, got RGBA=(${r},${g},${b},${a})`)
    return
  }

  if (want === 'green') {
    if (!(g > 200 && r < 60 && b < 60 && a === 255)) throw new Error(`expected green-ish, got RGBA=(${r},${g},${b},${a})`)
    return
  }

  if (want === 'blue') {
    if (!(b > 200 && r < 60 && g < 60 && a === 255)) throw new Error(`expected blue-ish, got RGBA=(${r},${g},${b},${a})`)
    return
  }
}

function countUniqueColorsSampled(
  rgba: Uint8Array,
  w: number,
  h: number,
  opts: { step?: number; x0?: number; y0?: number; x1?: number; y1?: number } = {},
): number {
  const step = Math.max(1, opts.step ?? 8)
  const x0 = Math.max(0, opts.x0 ?? 0)
  const y0 = Math.max(0, opts.y0 ?? 0)
  const x1 = Math.min(w, opts.x1 ?? w)
  const y1 = Math.min(h, opts.y1 ?? h)

  const set = new Set<number>()

  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const [r, g, b, a] = getPixelRgba(rgba, w, x, y)
      if (a === 0) continue

      // Quantize to nibbles to be robust to minor decode differences.
      const key = ((r >> 4) << 12) | ((g >> 4) << 8) | ((b >> 4) << 4) | (a >> 4)
      set.add(key)
    }
  }

  return set.size
}

function countNonBlackInRect(
  rgba: Uint8Array,
  w: number,
  rect: { x: number; y: number; w: number; h: number },
  h = Math.floor(rgba.length / (w * 4)),
): number {
  let n = 0
  const x0 = Math.max(0, rect.x | 0)
  const y0 = Math.max(0, rect.y | 0)
  const x1 = Math.min(w, x0 + (rect.w | 0))
  const y1 = Math.min(h, y0 + (rect.h | 0))

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const [r, g, b, a] = getPixelRgba(rgba, w, x, y)
      if (a > 0 && (r | g | b) !== 0) n++
    }
  }

  return n
}

async function main(): Promise<void> {
  const wasmPath =
    process.env.CANVASKIT_WASM ||
    path.resolve(__dirname, '../../third-party/skia/out/canvaskit_wasm_cheap_no_glue/canvaskit.wasm')

  await CanvasKitApi.ready({ path: wasmPath })
  const textEncoder = new TextEncoder()

  const ck = {
    // memory
    malloc(size: number): number {
      return CanvasKitApi.malloc(size) as unknown as number
    },

    free(ptr: number): void {
      CanvasKitApi.free(ptr >>> 0)
    },

    allocBytes(bytes: Uint8Array): number {
      return CanvasKitApi.alloc(bytes) as unknown as number
    },

    allocMatrix(m9: ArrayLike<number>): number {
      const ptr = CanvasKitApi.malloc(9 * 4) as unknown as number
      writeF32Array(ptr, m9)
      return ptr
    },

    // Surface
    makeSwCanvasSurface(w: number, h: number): number {
      return CanvasKitApi.Surface.makeSw(w | 0, h | 0) as unknown as number
    },

    deleteSurface(surface: number): void {
      CanvasKitApi.Surface.delete(surface >>> 0)
    },

    surfaceGetCanvas(surface: number): number {
      return CanvasKitApi.Surface.getCanvas(surface >>> 0) as unknown as number
    },

    surfaceFlush(surface: number): void {
      CanvasKitApi.Surface.flush(surface >>> 0)
    },

    readSurfacePixelsRgba8888(surface: number, w: number, h: number): Uint8Array {
      const byteLen = (w | 0) * (h | 0) * 4
      const dst = CanvasKitApi.malloc(byteLen) as unknown as number

      try {
        const ok = CanvasKitApi.Surface.readPixelsRgba8888(surface >>> 0, 0, 0, w | 0, h | 0, dst >>> 0, (w | 0) * 4)
        if (!ok) return new Uint8Array()
        return readU8Copy(dst, byteLen)
      } finally {
        CanvasKitApi.free(dst >>> 0)
      }
    },

    encodeSurfaceToPngBytes(surface: number): Uint8Array {
      const dataPtr = CanvasKitApi.Surface.encodeToPng(surface >>> 0) as unknown as number
      return encodeDataToBytes(dataPtr)
    },

    // Paint
    makePaint(): number {
      return CanvasKitApi.Paint.make() as unknown as number
    },

    deletePaint(paint: number): void {
      CanvasKitApi.Paint.delete(paint >>> 0)
    },

    paintSetColor(paint: number, argb: number): void {
      CanvasKitApi.Paint.setColor(paint >>> 0, argb >>> 0)
    },

    paintSetAntiAlias(paint: number, aa: boolean): void {
      CanvasKitApi.Paint.setAntiAlias(paint >>> 0, aa)
    },

    // Path
    makePath(): number {
      return CanvasKitApi.Path.make() as unknown as number
    },

    deletePath(path: number): void {
      CanvasKitApi.Path.delete(path >>> 0)
    },

    pathAddCircle(path: number, cx: number, cy: number, r: number): void {
      CanvasKitApi.Path.addCircle(path >>> 0, cx, cy, r)
    },

    pathSnapshot(path: number): number {
      return CanvasKitApi.Path.snapshot(path >>> 0) as unknown as number
    },

    deleteSkPath(skPath: number): void {
      CanvasKitApi.Path.deleteSkPath(skPath >>> 0)
    },

    pathTransform(skPath: number, m9Ptr: number): void {
      CanvasKitApi.Path.transform(skPath >>> 0, m9Ptr >>> 0)
    },

    // Canvas
    canvasClear(canvas: number, argb: number): void {
      CanvasKitApi.Canvas.clear(canvas >>> 0, argb >>> 0)
    },

    canvasDrawRect(canvas: number, l: number, t: number, r: number, b: number, paint: number): void {
      CanvasKitApi.Canvas.drawRect(canvas >>> 0, l, t, r, b, paint >>> 0)
    },

    canvasDrawSkPath(canvas: number, skPath: number, paint: number): void {
      CanvasKitApi.Canvas.drawSkPath(canvas >>> 0, skPath >>> 0, paint >>> 0)
    },

    canvasDrawTextBlob(canvas: number, blob: number, x: number, y: number, paint: number): void {
      CanvasKitApi.Canvas.drawTextBlob(canvas >>> 0, blob >>> 0, x, y, paint >>> 0)
    },

    canvasDrawImage(canvas: number, image: number, x: number, y: number, filterMode: number, mipmapMode: number): void {
      CanvasKitApi.Canvas.drawImage(canvas >>> 0, image >>> 0, x, y, filterMode as any, mipmapMode as any)
    },

    canvasDrawImageRect(
      canvas: number,
      image: number,
      srcL: number,
      srcT: number,
      srcR: number,
      srcB: number,
      dstL: number,
      dstT: number,
      dstR: number,
      dstB: number,
      filterMode: number,
      mipmapMode: number,
    ): void {
      CanvasKitApi.Canvas.drawImageRect(
        canvas >>> 0,
        image >>> 0,
        srcL,
        srcT,
        srcR,
        srcB,
        dstL,
        dstT,
        dstR,
        dstB,
        filterMode as any,
        mipmapMode as any,
      )
    },

    // Image
    makeImageFromEncodedBytes(bytes: Uint8Array): number {
      const ptr = CanvasKitApi.alloc(bytes) as unknown as number
      try {
        return CanvasKitApi.Image.makeFromEncoded(ptr >>> 0, bytes.length) as unknown as number
      } finally {
        CanvasKitApi.free(ptr >>> 0)
      }
    },

    deleteImage(image: number): void {
      CanvasKitApi.Image.delete(image >>> 0)
    },

    imageWidth(image: number): number {
      return CanvasKitApi.Image.width(image >>> 0) | 0
    },

    imageHeight(image: number): number {
      return CanvasKitApi.Image.height(image >>> 0) | 0
    },

    readImagePixelsRgba8888(image: number, w: number, h: number): Uint8Array {
      const byteLen = (w | 0) * (h | 0) * 4
      const dst = CanvasKitApi.malloc(byteLen) as unknown as number

      try {
        const ok = CanvasKitApi.Image.readPixelsRgba8888(image >>> 0, 0, 0, w | 0, h | 0, dst >>> 0, (w | 0) * 4)
        if (!ok) return new Uint8Array()
        return readU8Copy(dst, byteLen)
      } finally {
        CanvasKitApi.free(dst >>> 0)
      }
    },

    // Font / Typeface / TextBlob
    makeFont(): number {
      return CanvasKitApi.invoke('MakeFont') as number
    },

    deleteFont(font: number): void {
      CanvasKitApi.invoke('DeleteFont', font >>> 0)
    },

    fontSetSize(font: number, size: number): void {
      CanvasKitApi.invoke('Font_setSize', font >>> 0, +size)
    },

    makeTypefaceFromBytes(bytes: Uint8Array, ttcIndex: number): number {
      const ptr = CanvasKitApi.alloc(bytes) as unknown as number
      try {
        return (CanvasKitApi.invoke('MakeTypefaceFromData', ptr >>> 0, bytes.length | 0, ttcIndex | 0) as number) >>> 0
      } finally {
        CanvasKitApi.free(ptr >>> 0)
      }
    },

    deleteTypeface(typeface: number): void {
      CanvasKitApi.invoke('DeleteTypeface', typeface >>> 0)
    },

    fontSetTypeface(font: number, typeface: number): void {
      CanvasKitApi.invoke('Font_setTypeface', font >>> 0, typeface >>> 0)
    },

    makeTextBlobFromUtf8(text: string, font: number): number {
      const bytes = textEncoder.encode(text)
      const ptr = CanvasKitApi.alloc(bytes) as unknown as number
      try {
        // encoding: 0 => UTF8
        return (CanvasKitApi.invoke('MakeTextBlobFromText', ptr >>> 0, bytes.length | 0, font >>> 0, 0) as number) >>> 0
      } finally {
        CanvasKitApi.free(ptr >>> 0)
      }
    },

    deleteTextBlob(blob: number): void {
      CanvasKitApi.invoke('DeleteTextBlob', blob >>> 0)
    },
  }

  // ---- Vector smoke (64x64) ----
  {
    const w = 64
    const h = 64

    const surface = ck.makeSwCanvasSurface(w, h)
    if (!surface) throw new Error('makeSwCanvasSurface failed')

    const canvas = ck.surfaceGetCanvas(surface)
    if (!canvas) throw new Error('surfaceGetCanvas failed')

    // rect
    const paint = ck.makePaint()
    ck.paintSetAntiAlias(paint, true)
    ck.paintSetColor(paint, 0xffff0000)

    ck.canvasClear(canvas, 0xff000000)
    ck.canvasDrawRect(canvas, 8, 8, 56, 56, paint)
    ck.surfaceFlush(surface)

    let rgba = ck.readSurfacePixelsRgba8888(surface, w, h)
    if (!rgba.length) throw new Error('readPixels empty (rect)')
    assertMostlyColor(getPixelRgba(rgba, w, 32, 32), 'red')

    // path (green circle)
    ck.canvasClear(canvas, 0xff000000)

    const pathPaint = ck.makePaint()
    ck.paintSetAntiAlias(pathPaint, true)
    ck.paintSetColor(pathPaint, 0xff00ff00)

    const pb = ck.makePath()
    ck.pathAddCircle(pb, 0, 0, 10)
    const skPath = ck.pathSnapshot(pb)
    ck.deletePath(pb)

    if (!skPath) throw new Error('pathSnapshot failed')

    const mPtr = ck.allocMatrix([1, 0, 32, 0, 1, 32, 0, 0, 1])
    ck.pathTransform(skPath, mPtr)
    ck.free(mPtr)

    ck.canvasDrawSkPath(canvas, skPath, pathPaint)
    ck.surfaceFlush(surface)

    rgba = ck.readSurfacePixelsRgba8888(surface, w, h)
    if (!rgba.length) throw new Error('readPixels empty (path)')
    assertMostlyColor(getPixelRgba(rgba, w, 32, 32), 'green')

    ck.deleteSkPath(skPath)

    // text
    ck.canvasClear(canvas, 0xff000000)

    const font = ck.makeFont()
    ck.fontSetSize(font, 28)

    const fontPath =
      process.env.CANVASKIT_FONT ||
      path.resolve(__dirname, '../../third-party/skia/modules/canvaskit/fonts/NotoMono-Regular.ttf')
    const fontBytes = await fs.readFile(fontPath)

    const typeface = ck.makeTypefaceFromBytes(fontBytes, 0)
    if (!typeface) throw new Error(`makeTypefaceFromBytes failed for ${fontPath}`)

    ck.fontSetTypeface(font, typeface)

    const textPaint = ck.makePaint()
    ck.paintSetAntiAlias(textPaint, true)
    ck.paintSetColor(textPaint, 0xffffff00)

    const blob = ck.makeTextBlobFromUtf8('WW', font)
    if (!blob) throw new Error('makeTextBlobFromUtf8 failed')

    ck.canvasDrawTextBlob(canvas, blob, 6, 38, textPaint)
    ck.surfaceFlush(surface)

    rgba = ck.readSurfacePixelsRgba8888(surface, w, h)
    if (!rgba.length) throw new Error('readPixels empty (text)')

    const nonBlack = countNonBlackInRect(rgba, w, { x: 0, y: 0, w, h })
    if (nonBlack === 0) throw new Error('expected some non-black pixels from text draw')

    // cleanup
    ck.deleteTextBlob(blob)
    ck.deletePaint(textPaint)
    ck.deleteTypeface(typeface)
    ck.deleteFont(font)
    ck.deletePaint(pathPaint)
    ck.deletePaint(paint)
    ck.deleteSurface(surface)
  }

  // ---- Image decode + drawImage* assertions (128x128) ----
  {
    const w = 128
    const h = 128

    const surface = ck.makeSwCanvasSurface(w, h)
    if (!surface) throw new Error('makeSwCanvasSurface failed (image) ')

    const canvas = ck.surfaceGetCanvas(surface)
    if (!canvas) throw new Error('surfaceGetCanvas failed (image)')

    const pngPath =
      process.env.CANVASKIT_PNG ||
      path.resolve(__dirname, '../../third-party/skia/resources/images/mandrill_64.png')

    const jpgPath =
      process.env.CANVASKIT_JPG ||
      path.resolve(__dirname, '../../third-party/skia/resources/images/dog.jpg')

    const pngBytes = await fs.readFile(pngPath)
    const imgPng = ck.makeImageFromEncodedBytes(pngBytes)
    if (!imgPng) throw new Error(`makeImageFromEncodedBytes failed for ${pngPath}`)

    const pngW = ck.imageWidth(imgPng)
    const pngH = ck.imageHeight(imgPng)
    if (pngW !== 64 || pngH !== 64) throw new Error(`unexpected mandrill_64 size: ${pngW}x${pngH}`)

    // image readPixels: decoded image itself should contain non-black pixels
    {
      const pixels = ck.readImagePixelsRgba8888(imgPng, pngW, pngH)
      if (!pixels.length) throw new Error('readImagePixelsRgba8888 empty (png)')

      const nonBlackImg = countNonBlackInRect(pixels, pngW, { x: 0, y: 0, w: pngW, h: pngH })
      if (nonBlackImg < 200) throw new Error(`expected many non-black pixels in decoded png, got ${nonBlackImg}`)

      const unique = countUniqueColorsSampled(pixels, pngW, pngH, { step: 4 })
      if (unique < 12) throw new Error(`expected color diversity in decoded png, got unique≈${unique}`)
    }

    // drawImage: verify region changes, outside stays black
    ck.canvasClear(canvas, 0xff000000)
    ck.canvasDrawImage(canvas, imgPng, 10, 10, 1, 0)
    ck.surfaceFlush(surface)

    let rgba = ck.readSurfacePixelsRgba8888(surface, w, h)
    if (!rgba.length) throw new Error('readPixels empty (drawImage png)')

    if (!isBlack(getPixelRgba(rgba, w, 0, 0))) throw new Error('expected (0,0) to stay black after drawImage')
    if (!isBlack(getPixelRgba(rgba, w, 127, 127)))
      throw new Error('expected (127,127) to stay black after drawImage')

    const changed = countNonBlackInRect(rgba, w, { x: 10, y: 10, w: pngW, h: pngH })
    if (changed < 200) throw new Error(`expected many non-black pixels in drawn png region, got ${changed}`)

    // drawImageRect: verify top half changes, bottom stays black
    ck.canvasClear(canvas, 0xff000000)
    ck.canvasDrawImageRect(canvas, imgPng, 0, 0, pngW, pngH, 0, 0, 128, 64, 1, 0)
    ck.surfaceFlush(surface)

    rgba = ck.readSurfacePixelsRgba8888(surface, w, h)
    if (!rgba.length) throw new Error('readPixels empty (drawImageRect png)')

    const topChanged = countNonBlackInRect(rgba, w, { x: 0, y: 0, w: 128, h: 64 })
    if (topChanged < 500) throw new Error(`expected many non-black pixels in top half after drawImageRect, got ${topChanged}`)

    if (!isBlack(getPixelRgba(rgba, w, 10, 100)))
      throw new Error('expected bottom area to stay black after drawImageRect')

    // JPG decode + drawImage sanity
    const jpgBytes = await fs.readFile(jpgPath)
    const imgJpg = ck.makeImageFromEncodedBytes(jpgBytes)
    if (!imgJpg) throw new Error(`makeImageFromEncodedBytes failed for ${jpgPath}`)

    const jpgW = ck.imageWidth(imgJpg)
    const jpgH = ck.imageHeight(imgJpg)
    if (jpgW <= 0 || jpgH <= 0) throw new Error(`invalid jpg size: ${jpgW}x${jpgH}`)

    {
      const sampleW = Math.min(jpgW, 128)
      const sampleH = Math.min(jpgH, 128)

      const pixels = ck.readImagePixelsRgba8888(imgJpg, sampleW, sampleH)
      if (!pixels.length) throw new Error('readImagePixelsRgba8888 empty (jpg)')

      const nonBlackImg = countNonBlackInRect(pixels, sampleW, { x: 0, y: 0, w: sampleW, h: sampleH })
      if (nonBlackImg < 200) throw new Error(`expected many non-black pixels in decoded jpg sample, got ${nonBlackImg}`)

      const unique = countUniqueColorsSampled(pixels, sampleW, sampleH, { step: 8 })
      if (unique < 12) throw new Error(`expected color diversity in decoded jpg sample, got unique≈${unique}`)
    }

    ck.canvasClear(canvas, 0xff000000)
    ck.canvasDrawImage(canvas, imgJpg, 0, 0, 1, 0)
    ck.surfaceFlush(surface)

    rgba = ck.readSurfacePixelsRgba8888(surface, w, h)
    if (!rgba.length) throw new Error('readPixels empty (drawImage jpg)')

    const anyChanged = countNonBlackInRect(rgba, w, { x: 0, y: 0, w, h })
    if (anyChanged < 500) throw new Error(`expected many non-black pixels after drawing jpg, got ${anyChanged}`)

    // Encode rendered surface to PNG, then decode back to validate encode+decode pipeline.
    const pngOut = ck.encodeSurfaceToPngBytes(surface)
    assertPngMagic(pngOut)
    if (pngOut.length < 64) throw new Error(`expected non-trivial PNG output, got ${pngOut.length} bytes`)

    const roundtrip = ck.makeImageFromEncodedBytes(pngOut)
    if (!roundtrip) throw new Error('expected roundtrip decode of encoded surface PNG to succeed')

    const rtW = ck.imageWidth(roundtrip)
    const rtH = ck.imageHeight(roundtrip)
    if (rtW !== w || rtH !== h) throw new Error(`unexpected roundtrip image size: ${rtW}x${rtH} (want ${w}x${h})`)

    ck.deleteImage(roundtrip)
    ck.deleteImage(imgJpg)
    ck.deleteImage(imgPng)
    ck.deleteSurface(surface)
  }

  process.stdout.write('bindings smoke ok\n')
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})
