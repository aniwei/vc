/*
 * Benchmark: cheap binding vs CanvasKit embind (canvaskit-wasm).
 *
 * Usage:
 *   node --expose-gc scripts/bench-canvaskit-bindings.js cheap 200000
 *   node --expose-gc scripts/bench-canvaskit-bindings.js embind 200000
 */

const fs = require('node:fs')
const path = require('node:path')

function hrMs() {
  return Number(process.hrtime.bigint()) / 1e6
}

function fmt(ms) {
  return `${ms.toFixed(2)}ms`
}

function maybeGC() {
  if (global.gc) {
    global.gc()
  }
}

function requireWorkspace(modulePath) {
  return require(path.resolve(__dirname, '..', modulePath))
}

async function initCheap() {
  const { createCanvasKit } = requireWorkspace('packages/bindings/dist')
  const wasmPath =
    process.env.CANVASKIT_WASM ||
    path.resolve(__dirname, '../packages/third-party/skia/out/canvaskit_wasm_cheap_no_glue/canvaskit.wasm')
  const ck = await createCanvasKit({ wasmPath })
  return { kind: 'cheap', ck }
}

async function initEmbind() {
  // Expect dependency: canvaskit-wasm
  // In Node, CanvasKitInit lives under the package root (default export).
  // Some versions require: require('canvaskit-wasm').default
  let CanvasKitInit = null
  // Use the official embind "full" build to represent the original CanvasKit JS glue.
  // IMPORTANT: JS and WASM must come from the same variant (bin/full), otherwise
  // embind can throw "unknown type 0" during init.
  const mod = require('canvaskit-wasm/full')
  CanvasKitInit = mod && mod.default ? mod.default : mod

  if (typeof CanvasKitInit !== 'function') {
    throw new Error('Failed to load CanvasKitInit from canvaskit-wasm')
  }

  // Help CanvasKit locate its wasm inside node_modules.
  // This works for both `bin/full/` and `bin/` layouts.
  const pkgRoot = path.dirname(require.resolve('canvaskit-wasm/package.json'))

  const ck = await CanvasKitInit({
    locateFile: (file) => {
      const fullPath = path.join(pkgRoot, 'bin', 'full', file)
      if (fs.existsSync(fullPath)) return fullPath
      return file
    },
  })

  return { kind: 'embind', ck }
}

function runBenchCase(name, n, fn) {
  maybeGC()
  const t0 = hrMs()
  fn()
  const t1 = hrMs()
  return { name, n, ms: t1 - t0 }
}

function printResults(kind, initMs, results) {
  console.log(`\n=== ${kind} ===`)
  console.log(`init: ${fmt(initMs)}`)
  for (const r of results) {
    const per = (r.ms * 1e6) / r.n // ns/op
    console.log(`${r.name} (N=${r.n}): ${fmt(r.ms)}  (${per.toFixed(1)} ns/op)`)
  }
}

function summarize(results) {
  const out = new Map()
  for (const r of results) {
    out.set(r.name, {
      n: r.n,
      ms: r.ms,
      nsPerOp: (r.ms * 1e6) / r.n,
    })
  }
  return out
}

function printCompare(cheapInitMs, cheapResults, embindInitMs, embindResults) {
  const c = summarize(cheapResults)
  const e = summarize(embindResults)

  console.log(`\n=== compare ===`)
  console.log(`node: ${process.version}`)
  console.log(`init cheap:  ${fmt(cheapInitMs)}`)
  console.log(`init embind: ${fmt(embindInitMs)}`)
  console.log('')

  const names = [...new Set([...c.keys(), ...e.keys()])]
  names.sort()
  for (const name of names) {
    const cr = c.get(name)
    const er = e.get(name)
    if (!cr || !er) {
      console.log(`${name}: missing on ${cr ? 'embind' : 'cheap'}`)
      continue
    }
    const speedup = er.nsPerOp / cr.nsPerOp
    console.log(
      `${name} (N=${cr.n}): cheap ${cr.nsPerOp.toFixed(1)} ns/op | embind ${er.nsPerOp.toFixed(1)} ns/op | cheap x${speedup.toFixed(2)}`
    )
  }
}

function cheapBench(ck, n) {
  const results = []

  const nRect = n
  // Path / image / text can be substantially more expensive than rect draws.
  // Cap them so the benchmark completes quickly and is still comparable.
  const nPath = Math.min(n, 20000)
  const nImage = Math.min(n, 5000)
  const nText = Math.min(n, 5000)
  const nParagraph = Math.min(n, 2000)

  // Surface + canvas
  const W = 512
  const H = 512
  const surface = ck.makeSwCanvasSurface(W, H)
  const canvas = ck.surfaceGetCanvas(surface)

  // Paint
  const paint = ck.makePaint()
  ck.paintSetAntiAlias(paint, true)
  ck.paintSetColor(paint, 0xff3366ff)

  // Rect draw loop (no allocations)
  results.push(
    runBenchCase('drawRect4f', nRect, () => {
      ck.canvasClear(canvas, 0xff000000)
      for (let i = 0; i < nRect; i++) {
        const x = (i % 256) | 0
        const y = ((i / 256) | 0) % 256
        ck.canvasDrawRect(canvas, x, y, x + 10, y + 10, paint)
      }
      ck.surfaceFlush(surface)
    })
  )

  // Path draw loop (one path reused)
  const pb = ck.makePath()
  // `pathClose` is intentionally not exposed in the cheap subset; use a simple circle.
  ck.pathAddCircle(pb, 128, 128, 96)
  const skPath = ck.pathSnapshot(pb)
  ck.deletePath(pb)

  results.push(
    // Name aligns with embind case for compare mode.
    runBenchCase('drawPath(circle)', nPath, () => {
      ck.canvasClear(canvas, 0xff000000)
      for (let i = 0; i < nPath; i++) {
        ck.canvasDrawSkPath(canvas, skPath, paint)
      }
      ck.surfaceFlush(surface)
    })
  )

  // Image draw loop (decode once, draw many)
  const pngPath =
    process.env.CANVASKIT_PNG ||
    path.resolve(__dirname, '../packages/third-party/skia/resources/images/mandrill_64.png')
  const pngBytes = fs.readFileSync(pngPath)
  const img = ck.makeImageFromEncodedBytes(pngBytes)
  if (!img) throw new Error(`cheap: makeImageFromEncodedBytes failed for ${pngPath}`)

  const srcL = 0
  const srcT = 0
  const srcR = 64
  const srcB = 64
  const dstL = 10
  const dstT = 10
  const dstR = 10 + 128
  const dstB = 10 + 128

  results.push(
    runBenchCase('drawImageRect(png)', nImage, () => {
      ck.canvasClear(canvas, 0xff000000)
      for (let i = 0; i < nImage; i++) {
        ck.canvasDrawImageRect(
          canvas,
          img,
          srcL,
          srcT,
          srcR,
          srcB,
          dstL,
          dstT,
          dstR,
          dstB,
          1,
          0
        )
      }
      ck.surfaceFlush(surface)
    })
  )

  // Text draw loop (build blob once, draw many)
  const fontPath =
    process.env.CANVASKIT_FONT ||
    path.resolve(__dirname, '../packages/third-party/skia/modules/canvaskit/fonts/NotoMono-Regular.ttf')
  const fontBytes = fs.readFileSync(fontPath)
  const typeface = ck.makeTypefaceFromBytes(fontBytes, 0)
  if (!typeface) throw new Error(`cheap: makeTypefaceFromBytes failed for ${fontPath}`)
  const font = ck.makeFont()
  ck.fontSetSize(font, 28)
  ck.fontSetTypeface(font, typeface)
  const blob = ck.makeTextBlobFromUtf8('Hello CanvasKit', font)
  if (!blob) throw new Error('cheap: makeTextBlobFromUtf8 failed')

  results.push(
    runBenchCase('drawTextBlob', nText, () => {
      ck.canvasClear(canvas, 0xff000000)
      for (let i = 0; i < nText; i++) {
        ck.canvasDrawTextBlob(canvas, blob, 12, 128, paint)
      }
      ck.surfaceFlush(surface)
    })
  )

  // Paragraph draw loop (build once, draw many)
  const paraText =
    'Paragraph benchmark: The quick brown fox jumps over the lazy dog. 0123456789. ' +
    'Wrap wrap wrap — long-ish line to trigger layout.\nSecond line here.'
  const paraUtf8 = Buffer.from(paraText, 'utf8')
  const paraTextPtr = ck.allocBytes(paraUtf8)
  const paraFontPtr = ck.allocBytes(fontBytes)
  const wrapWidth = 400
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
  if (!paragraph) throw new Error('cheap: makeParagraphFromText returned null')
  ck.paragraphLayout(paragraph, wrapWidth)

  results.push(
    runBenchCase('drawParagraph', nParagraph, () => {
      ck.canvasClear(canvas, 0xff000000)
      for (let i = 0; i < nParagraph; i++) {
        ck.canvasDrawParagraph(canvas, paragraph, 10, 10)
      }
      ck.surfaceFlush(surface)
    })
  )

  // Cleanup
  ck.deleteTextBlob(blob)
  ck.deleteParagraph(paragraph)
  ck.deleteFont(font)
  ck.deleteTypeface(typeface)
  ck.deleteImage(img)
  ck.deleteSkPath(skPath)
  ck.deletePaint(paint)
  ck.deleteSurface(surface)

  return results
}

function embindBench(CanvasKit, n) {
  const results = []

  const nRect = n
  const nPath = Math.min(n, 20000)
  const nImage = Math.min(n, 5000)
  const nText = Math.min(n, 5000)
  const nParagraph = Math.min(n, 2000)

  const W = 512
  const H = 512
  const surface = CanvasKit.MakeSurface(W, H)
  if (!surface) throw new Error('CanvasKit.MakeSurface returned null')
  const canvas = surface.getCanvas()

  const paint = new CanvasKit.Paint()
  paint.setAntiAlias(true)
  paint.setColor(CanvasKit.Color(0x33, 0x66, 0xff, 1))

  results.push(
    runBenchCase('drawRect4f', nRect, () => {
      canvas.clear(CanvasKit.Color(0, 0, 0, 1))
      for (let i = 0; i < nRect; i++) {
        const x = (i % 256) | 0
        const y = ((i / 256) | 0) % 256
        canvas.drawRect4f(x, y, x + 10, y + 10, paint)
      }
      surface.flush()
    })
  )

  const p = new CanvasKit.Path()
  // Match cheap benchmark path shape (a circle) to reduce workload skew.
  p.addCircle(128, 128, 96)

  results.push(
    runBenchCase('drawPath(circle)', nPath, () => {
      canvas.clear(CanvasKit.Color(0, 0, 0, 1))
      for (let i = 0; i < nPath; i++) {
        canvas.drawPath(p, paint)
      }
      surface.flush()
    })
  )

  // Image draw loop (decode once, draw many)
  const pngPath =
    process.env.CANVASKIT_PNG ||
    path.resolve(__dirname, '../packages/third-party/skia/resources/images/mandrill_64.png')
  const pngBytes = fs.readFileSync(pngPath)
  const img = CanvasKit.MakeImageFromEncoded(pngBytes)
  if (!img) throw new Error(`embind: MakeImageFromEncoded failed for ${pngPath}`)

  const srcRect = CanvasKit.LTRBRect(0, 0, 64, 64)
  const dstRect = CanvasKit.LTRBRect(10, 10, 10 + 128, 10 + 128)
  results.push(
    runBenchCase('drawImageRect(png)', nImage, () => {
      canvas.clear(CanvasKit.Color(0, 0, 0, 1))
      for (let i = 0; i < nImage; i++) {
        canvas.drawImageRect(img, srcRect, dstRect, paint, true)
      }
      surface.flush()
    })
  )

  // Text draw loop (build blob once, draw many)
  const fontPath =
    process.env.CANVASKIT_FONT ||
    path.resolve(__dirname, '../packages/third-party/skia/modules/canvaskit/fonts/NotoMono-Regular.ttf')
  const fontBytes = fs.readFileSync(fontPath)
  const typeface = CanvasKit.Typeface.MakeTypefaceFromData(fontBytes)
  if (!typeface) throw new Error(`embind: Typeface.MakeTypefaceFromData failed for ${fontPath}`)
  const font = new CanvasKit.Font(typeface, 28)
  const blob = CanvasKit.TextBlob.MakeFromText('Hello CanvasKit', font)
  results.push(
    runBenchCase('drawTextBlob', nText, () => {
      canvas.clear(CanvasKit.Color(0, 0, 0, 1))
      for (let i = 0; i < nText; i++) {
        canvas.drawTextBlob(blob, 12, 128, paint)
      }
      surface.flush()
    })
  )

  // Paragraph draw loop (build once, draw many)
  const fontAb = fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength)
  const fontMgr = CanvasKit.FontMgr.FromData(fontAb)
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
  paragraph.layout(400)

  results.push(
    runBenchCase('drawParagraph', nParagraph, () => {
      canvas.clear(CanvasKit.Color(0, 0, 0, 1))
      for (let i = 0; i < nParagraph; i++) {
        canvas.drawParagraph(paragraph, 10, 10)
      }
      surface.flush()
    })
  )

  blob.delete()
  paragraph.delete()
  builder.delete()
  fontMgr.delete()
  font.delete()
  typeface.delete()
  img.delete()
  p.delete()
  paint.delete()
  surface.dispose()

  return results
}

async function main() {
  const mode = (process.argv[2] || '').toLowerCase()
  const n = Number(process.argv[3] || 200000)

  if (!mode || (mode !== 'cheap' && mode !== 'embind' && mode !== 'compare')) {
    console.error('Usage: node --expose-gc scripts/bench-canvaskit-bindings.js <cheap|embind|compare> [N]')
    process.exit(2)
  }

  if (mode === 'compare') {
    maybeGC()
    const t0c = hrMs()
    const cheap = await initCheap()
    const cheapInitMs = hrMs() - t0c

    // small warmup
    maybeGC()
    for (let i = 0; i < 2; i++) {
      cheapBench(cheap.ck, 2000)
      maybeGC()
    }
    const cheapResults = cheapBench(cheap.ck, n)

    maybeGC()
    const t0e = hrMs()
    const embind = await initEmbind()
    const embindInitMs = hrMs() - t0e

    maybeGC()
    for (let i = 0; i < 2; i++) {
      embindBench(embind.ck, 2000)
      maybeGC()
    }
    const embindResults = embindBench(embind.ck, n)

    printCompare(cheapInitMs, cheapResults, embindInitMs, embindResults)
    return
  }

  maybeGC()
  const t0 = hrMs()
  const { ck, kind } = mode === 'cheap' ? await initCheap() : await initEmbind()
  const initMs = hrMs() - t0

  // small warmup
  maybeGC()
  for (let i = 0; i < 3; i++) {
    if (kind === 'cheap') cheapBench(ck, 2000)
    else embindBench(ck, 2000)
    maybeGC()
  }

  const results = kind === 'cheap' ? cheapBench(ck, n) : embindBench(ck, n)
  printResults(kind, initMs, results)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
