import { CanvasKitApi } from '../../../CanvasKitApi'

type RunResult =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; skipped: true; reason: string }

function getWasmUri(): string {
  const u = new URL(window.location.href)
  const wasm = u.searchParams.get('wasm')
  if (!wasm) throw new Error('missing ?wasm=')
  return wasm
}

async function runWebGLPathPaintSurfaceImage(): Promise<RunResult> {
  try {
    const wasmUri = getWasmUri()
    const ck = await CanvasKitApi.ready({ uri: wasmUri })

    if (!ck.WebGL.hasWebGL()) {
      return { ok: false, skipped: true, reason: 'missing WebGL exports' }
    }

    const canvas = document.getElementById('ck') as HTMLCanvasElement | null
    if (!canvas) {
      return { ok: false, error: 'missing canvas#ck' }
    }

    const selector = '#ck'
    const selBytes = new TextEncoder().encode(selector)
    const selPtr = ck.allocBytes(selBytes)
    const ctx = ck.WebGL.createContext(selPtr, selBytes.length, true)
    ck.free(selPtr)

    if (!ctx) {
      return { ok: false, error: 'WebGL_CreateContext returned 0' }
    }

    const makeCurrentRes = ck.WebGL.makeContextCurrent(ctx)
    if (makeCurrentRes !== 0) {
      return { ok: false, error: `WebGL_MakeContextCurrent failed: ${makeCurrentRes}` }
    }

    const surface = ck.WebGL.makeOnScreenSurface(canvas.width, canvas.height)
    if (!surface) {
      return { ok: false, error: 'MakeOnScreenCanvasSurface returned 0' }
    }

    const skCanvas = ck.Surface.getCanvas(surface)
    const paint = ck.Paint.make()
    ck.Paint.setAntiAlias(paint, true)
    ck.Paint.setColor(paint, 0xff00ff00)

    const path = ck.Path.make()
    ck.Path.addRect(path, 5, 5, 30, 30)

    ck.Canvas.clear(skCanvas, 0xff000000)
    ck.Canvas.drawPath(skCanvas, path, paint)
    ck.Surface.flush(surface)

    const img = ck.Surface.makeImageSnapshot(surface)
    if (!img) {
      return { ok: false, error: 'Surface_makeImageSnapshot returned 0' }
    }

    const data = ck.Image.encodeToPng(img)
    if (!data) {
      return { ok: false, error: 'Image_encodeToPNG returned 0' }
    }

    const size = ck.invoke('Data_size', data) as number
    if (!(size > 0)) {
      return { ok: false, error: `Data_size invalid: ${size}` }
    }

    ck.invoke('DeleteData', data)
    ck.Image.delete(img)
    ck.Path.delete(path)
    ck.Paint.delete(paint)
    ck.Surface.delete(surface)
    ck.WebGL.destroyContext(ctx)

    return { ok: true }
  }
  catch (e: any) {
    return { ok: false, error: e?.stack || String(e) }
  }
}

;(window as any).__runWebGLPathPaintSurfaceImage = runWebGLPathPaintSurfaceImage
