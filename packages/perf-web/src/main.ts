import CanvasKitInit from 'canvaskit-wasm/full'
import canvaskitWasmUrl from 'canvaskit-wasm/bin/full/canvaskit.wasm?url'

import { CanvasKitApi } from '../../bindings/src/CanvasKitApi'
import { Surface, Paint, PaintStyle } from '../../bindings/src'
import * as UI from '../../ui/src/Index'
import { Offset, Rect, Size } from '../../geometry/src'

async function createCanvasKit(options: { wasmPath: string }) {
  await CanvasKitApi.ready({ uri: options.wasmPath })

  return {
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

    // Paint
    makePaint(): number {
      return CanvasKitApi.Paint.make() as unknown as number
    },

    deletePaint(paint: number): void {
      CanvasKitApi.Paint.delete(paint >>> 0)
    },

    paintSetAntiAlias(paint: number, aa: boolean): void {
      CanvasKitApi.Paint.setAntiAlias(paint >>> 0, aa)
    },

    paintSetColor(paint: number, argb: number): void {
      CanvasKitApi.Paint.setColor(paint >>> 0, argb >>> 0)
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

    canvasDrawTextBlob(canvas: number, blob: number, x: number, y: number, paint: number): void {
      CanvasKitApi.Canvas.drawTextBlob(canvas >>> 0, blob >>> 0, x, y, paint >>> 0)
    },

    canvasDrawParagraph(canvas: number, paragraph: number, x: number, y: number): void {
      CanvasKitApi.Canvas.drawParagraph(canvas >>> 0, paragraph >>> 0, x, y)
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

    // Font/Typeface/TextBlob (raw invoke)
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

    makeFont(): number {
      return (CanvasKitApi.invoke('MakeFont') as number) >>> 0
    },

    deleteFont(font: number): void {
      CanvasKitApi.invoke('DeleteFont', font >>> 0)
    },

    fontSetSize(font: number, size: number): void {
      CanvasKitApi.invoke('Font_setSize', font >>> 0, +size)
    },

    fontSetTypeface(font: number, typeface: number): void {
      CanvasKitApi.invoke('Font_setTypeface', font >>> 0, typeface >>> 0)
    },

    makeTextBlobFromText(bytesPtr: number, byteLength: number, font: number, encoding: number): number {
      return (CanvasKitApi.invoke('MakeTextBlobFromText', bytesPtr >>> 0, byteLength | 0, font >>> 0, encoding | 0) as number) >>>
        0
    },

    deleteTextBlob(blob: number): void {
      CanvasKitApi.invoke('DeleteTextBlob', blob >>> 0)
    },

    // Paragraph
    makeParagraphFromText(
      utf8Ptr: number,
      byteLength: number,
      fontBytesPtr: number,
      fontByteLength: number,
      fontSize: number,
      wrapWidth: number,
      color: number,
      textAlign: number,
      maxLines: number,
    ): number {
      return CanvasKitApi.Paragraph.makeFromText(
        utf8Ptr >>> 0,
        byteLength | 0,
        fontBytesPtr >>> 0,
        fontByteLength | 0,
        +fontSize,
        +wrapWidth,
        color >>> 0,
        textAlign as any,
        maxLines | 0,
      ) as unknown as number
    },

    makeParagraphFromTextWithEllipsis(
      utf8Ptr: number,
      byteLength: number,
      fontBytesPtr: number,
      fontByteLength: number,
      fontSize: number,
      wrapWidth: number,
      color: number,
      textAlign: number,
      maxLines: number,
      ellipsisUtf8Ptr: number,
      ellipsisByteLength: number,
    ): number {
      return CanvasKitApi.Paragraph.makeFromTextWithEllipsis(
        utf8Ptr >>> 0,
        byteLength | 0,
        fontBytesPtr >>> 0,
        fontByteLength | 0,
        +fontSize,
        +wrapWidth,
        color >>> 0,
        textAlign as any,
        maxLines | 0,
        ellipsisUtf8Ptr >>> 0,
        ellipsisByteLength | 0,
      ) as unknown as number
    },

    paragraphLayout(paragraph: number, width: number): void {
      CanvasKitApi.Paragraph.layout(paragraph >>> 0, +width)
    },

    deleteParagraph(paragraph: number): void {
      CanvasKitApi.Paragraph.delete(paragraph >>> 0)
    },
  }
}

type Row = { name: string; n: number; ms: number; nsPerOp: number }

type BenchResult = {
  kind: 'cheap' | 'embind'
  initMs: number
  frames: number
  rectPerFrame: number
  pathPerFrame: number
  imagePerFrame: number
  textPerFrame: number
  paragraphPerFrame: number
  meanMsPerFrame: number
  medianMsPerFrame: number
  p95MsPerFrame: number
}

function nowMs(): number {
  return performance.now()
}

function fmt(ms: number): string {
  return `${ms.toFixed(2)}ms`
}

function log(outEl: HTMLElement, s: string) {
  outEl.textContent = `${outEl.textContent ?? ''}${s}\n`
}

function clear(outEl: HTMLElement) {
  outEl.textContent = ''
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch failed: ${url} (${res.status})`)
  return new Uint8Array(await res.arrayBuffer())
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] === undefined) return sorted[base]
  return sorted[base] + rest * (sorted[base + 1] - sorted[base])
}

function statsMsPerFrame(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b)
  const sum = samples.reduce((a, b) => a + b, 0)
  return {
    mean: samples.length ? sum / samples.length : 0,
    median: quantile(sorted, 0.5),
    p95: quantile(sorted, 0.95),
  }
}

function deriveScene(rectPerFrame: number) {
  // Default-ish scene: rect dominates, others are smaller fractions.
  // Match the earlier suggested defaults: rect=5000, path=200, image=100, text=50.
  const pathPerFrame = Math.max(1, Math.round(rectPerFrame / 25))
  const imagePerFrame = Math.max(1, Math.round(rectPerFrame / 50))
  const textPerFrame = Math.max(1, Math.round(rectPerFrame / 100))
  const paragraphPerFrame = Math.max(1, Math.round(rectPerFrame / 2000))
  return { rectPerFrame, pathPerFrame, imagePerFrame, textPerFrame, paragraphPerFrame }
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Ensure we pass an ArrayBuffer with the exact byte range.
  // Use Uint8Array#slice() to force an owning ArrayBuffer.
  return bytes.slice().buffer
}

async function benchCheap(frames: number, rectPerFrame: number, canvasEl: HTMLCanvasElement): Promise<BenchResult> {
  const scene = deriveScene(rectPerFrame)

  const t0 = nowMs()
  const ck = await createCanvasKit({ wasmPath: '/cheap/canvaskit.wasm' })
  const initMs = nowMs() - t0

  const W = canvasEl.width
  const H = canvasEl.height
  const surface = ck.makeSwCanvasSurface(W, H)
  const canvas = ck.surfaceGetCanvas(surface)

  const paint = ck.makePaint()
  ck.paintSetAntiAlias(paint, true)
  ck.paintSetColor(paint, 0xff3366ff)

  const pb = ck.makePath()
  ck.pathAddCircle(pb, 128, 128, 96)
  const skPath = ck.pathSnapshot(pb)
  ck.deletePath(pb)


  const imgBytes = await fetchBytes('/assets/mandrill_64.png')
  const img = ck.makeImageFromEncodedBytes(imgBytes)


  const fontBytes = await fetchBytes('/fonts/NotoMono-Regular.ttf')
  const typeface = ck.makeTypefaceFromBytes(fontBytes, 0)
  const font = ck.makeFont()
  ck.fontSetSize(font, 28)
  ck.fontSetTypeface(font, typeface)
  // Avoid Buffer-only helpers in browser; build blob from UTF-8 bytes.
  const textBytes = new TextEncoder().encode('Hello CanvasKit')
  const textPtr = ck.allocBytes(textBytes)
  const blob = ck.makeTextBlobFromText(textPtr, textBytes.length, font, 0)
  ck.free(textPtr)

  // Paragraph
  const paraText =
    'Paragraph benchmark: The quick brown fox jumps over the lazy dog. 0123456789. ' +
    'Wrap wrap wrap — long-ish line to trigger layout.\nSecond line here.'
  const paraUtf8 = new TextEncoder().encode(paraText)
  const paraTextPtr = ck.allocBytes(paraUtf8)
  const paraFontPtr = ck.allocBytes(fontBytes)
  const wrapWidth = Math.max(100, canvasEl.width - 20)
  const paragraph = ck.makeParagraphFromText(
    paraTextPtr,
    paraUtf8.length,
    paraFontPtr,
    fontBytes.length,
    28,
    wrapWidth,
    0xffeeeeee,
    0,
    4
  )
  ck.free(paraTextPtr)
  ck.free(paraFontPtr)
  if (!paragraph) throw new Error('cheap: MakeParagraphFromText returned null')
  ck.paragraphLayout(paragraph, wrapWidth)


  // Warmup a few frames to reduce first-run noise.
  for (let w = 0; w < 5; w++) {
    ck.canvasClear(canvas, 0xff000000)
    for (let i = 0; i < scene.rectPerFrame; i++) {
      const x = (i % 256) | 0
      const y = (((i / 256) | 0) % 256) | 0
      ck.canvasDrawRect(canvas, x, y, x + 10, y + 10, paint)
    }
    for (let i = 0; i < scene.pathPerFrame; i++) ck.canvasDrawSkPath(canvas, skPath, paint)
    for (let i = 0; i < scene.imagePerFrame; i++) ck.canvasDrawImageRect(canvas, img, 0, 0, 64, 64, 10, 10, 138, 138, 1, 0)
    for (let i = 0; i < scene.textPerFrame; i++) ck.canvasDrawTextBlob(canvas, blob, 12, 128, paint)
    for (let i = 0; i < scene.paragraphPerFrame; i++) ck.canvasDrawParagraph(canvas, paragraph, 10, 10 + i * 34)
    ck.surfaceFlush(surface)
  }

  const samples: number[] = []
  for (let f = 0; f < frames; f++) {
    const t0f = nowMs()
    ck.canvasClear(canvas, 0xff000000)
    for (let i = 0; i < scene.rectPerFrame; i++) {
      const x = (i % 256) | 0
      const y = (((i / 256) | 0) % 256) | 0
      ck.canvasDrawRect(canvas, x, y, x + 10, y + 10, paint)
    }
    for (let i = 0; i < scene.pathPerFrame; i++) ck.canvasDrawSkPath(canvas, skPath, paint)
    for (let i = 0; i < scene.imagePerFrame; i++) ck.canvasDrawImageRect(canvas, img, 0, 0, 64, 64, 10, 10, 138, 138, 1, 0)
    for (let i = 0; i < scene.textPerFrame; i++) ck.canvasDrawTextBlob(canvas, blob, 12, 128, paint)
    for (let i = 0; i < scene.paragraphPerFrame; i++) ck.canvasDrawParagraph(canvas, paragraph, 10, 10 + i * 34)
    ck.surfaceFlush(surface)
    const t1f = nowMs()
    samples.push(t1f - t0f)
  }

  const st = statsMsPerFrame(samples)

  // cleanup
  ck.deleteTextBlob(blob)
  ck.deleteParagraph(paragraph)
  ck.deleteFont(font)
  ck.deleteTypeface(typeface)
  ck.deleteImage(img)
  ck.deleteSkPath(skPath)
  ck.deletePaint(paint)
  ck.deleteSurface(surface)

  return {
    kind: 'cheap',
    initMs,
    frames,
    rectPerFrame: scene.rectPerFrame,
    pathPerFrame: scene.pathPerFrame,
    imagePerFrame: scene.imagePerFrame,
    textPerFrame: scene.textPerFrame,
    paragraphPerFrame: scene.paragraphPerFrame,
    meanMsPerFrame: st.mean,
    medianMsPerFrame: st.median,
    p95MsPerFrame: st.p95,
  }
}

async function benchEmbind(frames: number, rectPerFrame: number, canvasEl: HTMLCanvasElement): Promise<BenchResult> {
  const scene = deriveScene(rectPerFrame)

  const t0 = nowMs()
  const CanvasKit = await CanvasKitInit({
    locateFile: (file: string) => (file.endsWith('.wasm') ? canvaskitWasmUrl : file),
  })
  const initMs = nowMs() - t0

  const surface = CanvasKit.MakeSWCanvasSurface(canvasEl)
  if (!surface) throw new Error('embind: MakeSWCanvasSurface(canvas) returned null')
  const canvas = surface.getCanvas()

  const paint = new CanvasKit.Paint()
  paint.setAntiAlias(true)
  paint.setColor(CanvasKit.Color(0x33, 0x66, 0xff, 1))

  const rows: Row[] = []
  void rows

  const p = new CanvasKit.Path()
  p.addCircle(128, 128, 96)


  const imgBytes = await fetchBytes('/assets/mandrill_64.png')
  const img = CanvasKit.MakeImageFromEncoded(imgBytes)
  if (!img) throw new Error('embind: MakeImageFromEncoded returned null')
  const srcRect = CanvasKit.LTRBRect(0, 0, 64, 64)
  const dstRect = CanvasKit.LTRBRect(10, 10, 138, 138)


  const fontBytes = await fetchBytes('/fonts/NotoMono-Regular.ttf')
  const typeface = CanvasKit.Typeface.MakeTypefaceFromData(toExactArrayBuffer(fontBytes))
  if (!typeface) throw new Error('embind: MakeTypefaceFromData returned null')
  const font = new CanvasKit.Font(typeface, 28)
  const blob = CanvasKit.TextBlob.MakeFromText('Hello CanvasKit', font)

  // Paragraph
  const fontMgr = CanvasKit.FontMgr.FromData(toExactArrayBuffer(fontBytes))
  if (!fontMgr) throw new Error('embind: FontMgr.FromData returned null')
  const family = fontMgr.countFamilies() > 0 ? fontMgr.getFamilyName(0) : 'Noto Mono'
  const paraStyle = new CanvasKit.ParagraphStyle({
    textStyle: {
      color: CanvasKit.Color(0xee, 0xee, 0xee, 1),
      fontFamilies: [family],
      fontSize: 28,
    },
    maxLines: 4,
    textAlign: CanvasKit.TextAlign.Left,
  })
  const builder = CanvasKit.ParagraphBuilder.Make(paraStyle, fontMgr)
  const paraText =
    'Paragraph benchmark: The quick brown fox jumps over the lazy dog. 0123456789. ' +
    'Wrap wrap wrap — long-ish line to trigger layout.\nSecond line here.'
  builder.addText(paraText)
  const paragraph = builder.build()
  paragraph.layout(Math.max(100, canvasEl.width - 20))


  // Warmup
  for (let w = 0; w < 5; w++) {
    canvas.clear(CanvasKit.Color(0, 0, 0, 1))
    for (let i = 0; i < scene.rectPerFrame; i++) {
      const x = (i % 256) | 0
      const y = (((i / 256) | 0) % 256) | 0
      canvas.drawRect4f(x, y, x + 10, y + 10, paint)
    }
    for (let i = 0; i < scene.pathPerFrame; i++) canvas.drawPath(p, paint)
    for (let i = 0; i < scene.imagePerFrame; i++) canvas.drawImageRect(img, srcRect, dstRect, paint, true)
    for (let i = 0; i < scene.textPerFrame; i++) canvas.drawTextBlob(blob, 12, 128, paint)
    for (let i = 0; i < scene.paragraphPerFrame; i++) canvas.drawParagraph(paragraph, 10, 10 + i * 34)
    surface.flush()
  }

  const samples: number[] = []
  for (let f = 0; f < frames; f++) {
    const t0f = nowMs()
    canvas.clear(CanvasKit.Color(0, 0, 0, 1))
    for (let i = 0; i < scene.rectPerFrame; i++) {
      const x = (i % 256) | 0
      const y = (((i / 256) | 0) % 256) | 0
      canvas.drawRect4f(x, y, x + 10, y + 10, paint)
    }
    for (let i = 0; i < scene.pathPerFrame; i++) canvas.drawPath(p, paint)
    for (let i = 0; i < scene.imagePerFrame; i++) canvas.drawImageRect(img, srcRect, dstRect, paint, true)
    for (let i = 0; i < scene.textPerFrame; i++) canvas.drawTextBlob(blob, 12, 128, paint)
    for (let i = 0; i < scene.paragraphPerFrame; i++) canvas.drawParagraph(paragraph, 10, 10 + i * 34)
    surface.flush()
    const t1f = nowMs()
    samples.push(t1f - t0f)
  }

  const st = statsMsPerFrame(samples)

  paragraph.delete()
  builder.delete()
  fontMgr.delete()
  blob.delete()
  font.delete()
  typeface.delete()
  img.delete()
  p.delete()
  paint.delete()
  surface.dispose()

  return {
    kind: 'embind',
    initMs,
    frames,
    rectPerFrame: scene.rectPerFrame,
    pathPerFrame: scene.pathPerFrame,
    imagePerFrame: scene.imagePerFrame,
    textPerFrame: scene.textPerFrame,
    paragraphPerFrame: scene.paragraphPerFrame,
    meanMsPerFrame: st.mean,
    medianMsPerFrame: st.median,
    p95MsPerFrame: st.p95,
  }
}

function compare(cheap: BenchResult, embind: BenchResult) {
  const lines: string[] = []
  lines.push(
    `scene: rect=${cheap.rectPerFrame}/f path=${cheap.pathPerFrame}/f image=${cheap.imagePerFrame}/f text=${cheap.textPerFrame}/f paragraph=${cheap.paragraphPerFrame}/f`
  ) 
  lines.push(`frames: ${cheap.frames}`)
  lines.push('')

  lines.push(`init cheap:  ${fmt(cheap.initMs)}`)
  lines.push(`init embind: ${fmt(embind.initMs)}`)
  lines.push('')

  const cheapFps = cheap.meanMsPerFrame > 0 ? 1000 / cheap.meanMsPerFrame : 0
  const embindFps = embind.meanMsPerFrame > 0 ? 1000 / embind.meanMsPerFrame : 0
  const speedupMean = embind.meanMsPerFrame / cheap.meanMsPerFrame

  lines.push(`cheap  mean: ${fmt(cheap.meanMsPerFrame)}  (≈${cheapFps.toFixed(1)} fps)`) 
  lines.push(`cheap  p50 : ${fmt(cheap.medianMsPerFrame)}  p95: ${fmt(cheap.p95MsPerFrame)}`)
  lines.push(`embind mean: ${fmt(embind.meanMsPerFrame)}  (≈${embindFps.toFixed(1)} fps)`) 
  lines.push(`embind p50 : ${fmt(embind.medianMsPerFrame)}  p95: ${fmt(embind.p95MsPerFrame)}`)
  lines.push('')
  lines.push(`speedup (mean): cheap x${speedupMean.toFixed(2)}`)

  return lines.join('\n')
}

async function renderEllipsisDemo(canvasEl: HTMLCanvasElement): Promise<void> {
  const ck = await createCanvasKit({ wasmPath: '/cheap/canvaskit.wasm' })

  const W = canvasEl.width
  const H = canvasEl.height
  const surface = ck.makeSwCanvasSurface(W, H)
  const canvas = ck.surfaceGetCanvas(surface)

  const paint = ck.makePaint()
  ck.paintSetAntiAlias(paint, true)

  const fontBytes = await fetchBytes('/fonts/NotoMono-Regular.ttf')
  const fontPtr = ck.allocBytes(fontBytes)

  const wrapWidth = Math.max(120, W - 20)
  const text =
    'ellipsis demo: The quick brown fox jumps over the lazy dog. 0123456789.'

  const textBytes = new TextEncoder().encode(text)
  const textPtr = ck.allocBytes(textBytes)

  const ellipsisBytes = new TextEncoder().encode('…')
  const ellipsisPtr = ck.allocBytes(ellipsisBytes)

  try {
    const noEllipsis = ck.makeParagraphFromText(
      textPtr,
      textBytes.length,
      fontPtr,
      fontBytes.length,
      28,
      wrapWidth,
      0xffeeeeee,
      0,
      1,
    )

    const withEllipsis = ck.makeParagraphFromTextWithEllipsis(
      textPtr,
      textBytes.length,
      fontPtr,
      fontBytes.length,
      28,
      wrapWidth,
      0xffeeeeee,
      0,
      1,
      ellipsisPtr,
      ellipsisBytes.length,
    )

    if (!noEllipsis) throw new Error('cheap: MakeParagraphFromText (demo) returned null')
    if (!withEllipsis) throw new Error('cheap: MakeParagraphFromTextWithEllipsis (demo) returned null')

    ck.paragraphLayout(noEllipsis, wrapWidth)
    ck.paragraphLayout(withEllipsis, wrapWidth)

    ck.canvasClear(canvas, 0xff000000)

    ck.paintSetColor(paint, 0xff222222)
    ck.canvasDrawRect(canvas, 10, 10, 10 + wrapWidth, 10 + 40, paint)
    ck.canvasDrawRect(canvas, 10, 70, 10 + wrapWidth, 70 + 40, paint)

    ck.canvasDrawParagraph(canvas, noEllipsis, 12, 12)
    ck.canvasDrawParagraph(canvas, withEllipsis, 12, 72)
    ck.surfaceFlush(surface)

    ck.deleteParagraph(noEllipsis)
    ck.deleteParagraph(withEllipsis)
  } finally {
    ck.free(textPtr)
    ck.free(fontPtr)
    ck.free(ellipsisPtr)
    ck.deletePaint(paint)
    ck.deleteSurface(surface)
  }
}

async function renderUiDemo(canvasEl: HTMLCanvasElement): Promise<void> {
  // Use bindings + ui directly; render into a SW surface and blit pixels to the DOM canvas.
  await CanvasKitApi.ready({ uri: '/cheap/canvaskit.wasm' })

  const W = canvasEl.width | 0
  const H = canvasEl.height | 0
  const surface = Surface.makeSw(W, H)

  class DemoPainter extends UI.CustomBoxPainter {
    paint(context: any, size: Size, offset: Offset): void {
      const canvas = context.canvas
      if (!canvas) return

      canvas.clear(0xff0b0f14)

      const bgPaint = new Paint().setStyle(PaintStyle.Fill).setColor(0xff1f2937)
      const fgPaint = new Paint().setStyle(PaintStyle.Fill).setColor(0xff60a5fa)

      try {
        const outer = Rect.fromLTWH(offset.dx, offset.dy, size.width, size.height)
        const inner = Rect.fromLTWH(offset.dx + 16, offset.dy + 16, Math.max(0, size.width - 32), 56)
        canvas.drawRect(outer, bgPaint)
        canvas.drawRect(inner, fgPaint)
      } finally {
        bgPaint.dispose()
        fgPaint.dispose()
      }
    }
  }

  class FillBox extends UI.CustomBox<DemoPainter> {
    override layout(constraints: any): void {
      this.constraints = constraints
      this.size = new Size(constraints.maxWidth, constraints.maxHeight)
      this.needsLayout = false
    }
  }

  const view = new UI.View(new UI.ViewConfiguration(W, H, window.devicePixelRatio))
  view.adoptChild(new FillBox(new DemoPainter(), null))
  view.frame(surface.canvas)

  const bytes = surface.readPixelsRgba8888(0, 0, W, H)
  const ctx2d = canvasEl.getContext('2d')
  if (!ctx2d) {
    surface.dispose()
    throw new Error('renderUiDemo: canvas.getContext(\'2d\') returned null')
  }

  const img = new ImageData(new Uint8ClampedArray(bytes.buffer, bytes.byteOffset, bytes.byteLength), W, H)
  ctx2d.putImageData(img, 0, 0)
  surface.dispose()
}

async function main() {
  const outEl = document.getElementById('out')!
  const runBtn = document.getElementById('run') as HTMLButtonElement
  const rectPerFrameInput = document.getElementById('rectPerFrame') as HTMLInputElement
  const framesInput = document.getElementById('frames') as HTMLInputElement
  const canvasEl = document.getElementById('ck') as HTMLCanvasElement

  const run = async () => {
    runBtn.disabled = true
    clear(outEl)

    const rectPerFrame = Math.max(100, Number(rectPerFrameInput.value || 5000))
    const frames = Math.max(20, Number(framesInput.value || 200))
    const scene = deriveScene(rectPerFrame)
    log(outEl, `scene: rect=${scene.rectPerFrame}/f path=${scene.pathPerFrame}/f image=${scene.imagePerFrame}/f text=${scene.textPerFrame}/f`) 
    log(outEl, `frames=${frames}`)
    log(outEl, '')

    log(outEl, 'running cheap...')
    const cheap = await benchCheap(frames, rectPerFrame, canvasEl)
    log(outEl, `cheap done (init ${fmt(cheap.initMs)})`)

    log(outEl, 'running embind(full)...')
    const embind = await benchEmbind(frames, rectPerFrame, canvasEl)
    log(outEl, `embind done (init ${fmt(embind.initMs)})`)

    log(outEl, '')
    log(outEl, compare(cheap, embind))

    log(outEl, '')
    log(outEl, 'rendering ellipsis demo (cheap)...')
    await renderEllipsisDemo(canvasEl)
    log(outEl, 'ellipsis demo done')

    log(outEl, '')
    log(outEl, 'rendering ui demo (bindings.Surface.canvas + ui.View)...')
    await renderUiDemo(canvasEl)
    log(outEl, 'ui demo done')

    runBtn.disabled = false
  }

  runBtn.addEventListener('click', () => {
    run().catch((e) => {
      runBtn.disabled = false
      log(outEl, '')
      log(outEl, String(e?.stack || e))
    })
  })

  // auto-run once
  runBtn.click()
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
})
