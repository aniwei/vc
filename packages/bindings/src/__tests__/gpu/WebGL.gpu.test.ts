import { beforeAll, afterAll, describe, expect, it } from 'vitest'

import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { getTestWasmPath } from '../helpers/ensureCanvasKit'

function hasWasmExport(wasmPath: string, name: string): boolean {
  const buf = fs.readFileSync(wasmPath)
  const mod = new WebAssembly.Module(buf)
  return WebAssembly.Module.exports(mod).some((e) => e.name === name)
}

describe('GPU (WebGL) path/paint/surface/image', () => {
  const enabled = process.env.RUN_BROWSER_GPU_TESTS === '1'

  if (!enabled) {
    it.skip('set RUN_BROWSER_GPU_TESTS=1 to enable', () => {})
    return
  }

  const wasmPath = process.env.CANVASKIT_WASM ?? getTestWasmPath()
  if (!/^https?:\/\//i.test(wasmPath)) {
    const ok =
      hasWasmExport(wasmPath, 'WebGL_CreateContext') &&
      hasWasmExport(wasmPath, 'WebGL_MakeContextCurrent') &&
      hasWasmExport(wasmPath, 'MakeOnScreenCanvasSurface')

    if (!ok) {
      it.skip('wasm missing CHEAP_WEBGL exports; rebuild with --webgl', () => {})
      return
    }
  }

  // Puppeteer might be installed, but its managed Chrome may not be present
  // (e.g. pnpm configured with ignore-scripts=true). In that case, skip with
  // a clear action item.
  {
    const require = createRequire(import.meta.url)
    try {
      const puppeteer = require('puppeteer')
      puppeteer.executablePath()
    } catch (err: any) {
      const msg = String(err?.message || err)
      if (/Could not find Chrome/i.test(msg)) {
        it.skip('missing puppeteer Chrome; run `pnpm -C packages/bindings exec puppeteer browsers install chrome`', () => {})
        return
      }
      throw err
    }
  }

  let server: any = null
  let browser: any = null

  beforeAll(async () => {
    const repoRoot = path.resolve(__dirname, '../../../../..')
    const harnessRoot = path.resolve(__dirname, './harness')

    const [{ createServer }, puppeteer] = await Promise.all([
      import('vite'),
      import('puppeteer'),
    ])

    server = await createServer({
      root: harnessRoot,
      server: {
        port: 0,
        strictPort: false,
        fs: {
          allow: [repoRoot],
        },
      },
      logLevel: 'error',
    })

    await server.listen()

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }, 60_000)

  afterAll(async () => {
    if (browser) {
      await browser.close()
      browser = null
    }
    if (server) {
      await server.close()
      server = null
    }
  })

  it('draws on WebGL surface and encodes PNG', async () => {
    expect(server).not.toBeNull()
    expect(browser).not.toBeNull()

    const page = await browser!.newPage()

    const resolvedWasmUri = /^https?:\/\//i.test(wasmPath) ? wasmPath : `/@fs${wasmPath}`
    const url = new URL(server!.resolvedUrls!.local[0])
    url.searchParams.set('wasm', resolvedWasmUri)

    await page.goto(url.toString(), { waitUntil: 'networkidle0' })

    const result = await page.evaluate(async () => {
      const fn = (window as any).__runWebGLPathPaintSurfaceImage
      if (typeof fn !== 'function') {
        return { ok: false, error: 'missing window.__runWebGLPathPaintSurfaceImage' }
      }
      return await fn()
    })

    await page.close()

    if (result?.skipped) {
      return
    }

    expect(result).toEqual({ ok: true })
  }, 60_000)
})
