import CanvasKitInit from 'canvaskit-wasm/full'
import canvaskitWasmUrl from 'canvaskit-wasm/bin/full/canvaskit.wasm?url'

// Import the workspace bindings source directly (not the built CJS dist)
import { createCanvasKit } from '../../bindings/src/CanvasKit'

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
