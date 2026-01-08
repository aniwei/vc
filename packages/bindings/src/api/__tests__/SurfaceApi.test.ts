import { describe, expect, it } from 'vitest'

import { SurfaceApi } from '../SurfaceApi'
import { getCanvasKit } from './getCanvasKit'

describe('SurfaceApi', () => {
  it('makeSw coerces dimensions and readPixels works', async () => {
    const wasm = await getCanvasKit()
    const api = new SurfaceApi(wasm)

    const surface = api.makeSw(3.9, 4.1)
    expect(surface).toBeTruthy()
    expect(api.width(surface)).toBe(3)
    expect(api.height(surface)).toBe(4)

    const dst = wasm.malloc(3 * 4 * 4)
    const ok = api.readPixelsRgba8888(surface, 0, 0, 3, 4, dst, 3 * 4)
    wasm.free(dst)
    expect(ok).toBe(1)

    api.delete(surface)
  })

  it('makeCanvas returns a surface (or 0 if unavailable)', async () => {
    const wasm = await getCanvasKit()
    const api = new SurfaceApi(wasm)

    const surface = api.makeCanvas(10.9, 20.1)
    if (surface === 0) {
      // Some builds may not provide this surface type.
      return
    }

    expect(api.width(surface)).toBe(10)
    expect(api.height(surface)).toBe(20)
    api.delete(surface)
  })
})
