import { describe, expect, it } from 'vitest'

import { SurfaceApi } from '../SurfaceApi'
import { createMockWasmApi } from './mockWasmApi'

describe('SurfaceApi', () => {
  it('makeCanvas returns 0 when wasm returns null', () => {
    const { wasm, calls } = createMockWasmApi({
      returns: {
        MakeCanvasSurface: null,
      },
    })

    const api = new SurfaceApi(wasm)
    expect(api.makeCanvas(10.9, 20.1)).toBe(0)
    expect(calls).toEqual([{ name: 'MakeCanvasSurface', args: [10, 20] }])
  })

  it('forwards calls and coerces args', () => {
    const { wasm, calls } = createMockWasmApi({
      returns: {
        MakeCanvasSurface: 101,
        MakeSWCanvasSurface: 202,
        Surface_getCanvas: 303,
        Surface_makeImageSnapshot: 404,
        Surface_width: 7.9,
        Surface_height: 8.1,
        Surface_encodeToPNG: 505,
        Surface_readPixelsRGBA8888: 1,
      },
    })

    const api = new SurfaceApi(wasm)
    expect(api.makeCanvas(1.9, 2.1)).toBe(101)
    expect(api.makeSw(3.9, 4.1)).toBe(202)
    api.flush(10 as any)
    expect(api.getCanvas(11 as any)).toBe(303)
    expect(api.makeImageSnapshot(12 as any)).toBe(404)
    expect(api.width(13 as any)).toBe(7)
    expect(api.height(14 as any)).toBe(8)
    expect(api.encodeToPng(15 as any)).toBe(505)
    expect(api.readPixelsRgba8888(16 as any, 1.2 as any, 2.9 as any, 3.1 as any, 4.8 as any, -1 as any, 64.9)).toBe(1)
    api.delete(17 as any)

    expect(calls).toEqual([
      { name: 'MakeCanvasSurface', args: [1, 2] },
      { name: 'MakeSWCanvasSurface', args: [3, 4] },
      { name: 'Surface_flush', args: [10] },
      { name: 'Surface_getCanvas', args: [11] },
      { name: 'Surface_makeImageSnapshot', args: [12] },
      { name: 'Surface_width', args: [13] },
      { name: 'Surface_height', args: [14] },
      { name: 'Surface_encodeToPNG', args: [15] },
      { name: 'Surface_readPixelsRGBA8888', args: [16, 1, 2, 3, 4, 0xffffffff, 64] },
      { name: 'DeleteSurface', args: [17] },
    ])
  })
})
