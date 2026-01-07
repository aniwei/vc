import { describe, expect, it } from 'vitest'

import { ImageApi } from '../ImageApi'
import { createMockWasmApi } from './mockWasmApi'

describe('ImageApi', () => {
  it('forwards calls and coerces args', () => {
    const { wasm, calls } = createMockWasmApi({
      returns: {
        MakeImageFromEncoded: 123,
        Image_width: 9,
        Image_height: 10,
        Image_readPixelsRGBA8888: 1,
        Image_encodeToPNG: 456,
      },
    })

    const api = new ImageApi(wasm)
    expect(api.makeFromEncoded(-1 as any, 2.9)).toBe(123)
    api.delete(77 as any)
    expect(api.width(88 as any)).toBe(9)
    expect(api.height(99 as any)).toBe(10)
    expect(api.readPixelsRgba8888(5 as any, 1.2 as any, 2.8 as any, 3.1 as any, 4.9 as any, -2 as any, 16.7)).toBe(1)
    expect(api.encodeToPng(101 as any)).toBe(456)

    expect(calls).toEqual([
      { name: 'MakeImageFromEncoded', args: [0xffffffff, 2] },
      { name: 'DeleteImage', args: [77] },
      { name: 'Image_width', args: [88] },
      { name: 'Image_height', args: [99] },
      { name: 'Image_readPixelsRGBA8888', args: [5, 1, 2, 3, 4, 0xfffffffe, 16] },
      { name: 'Image_encodeToPNG', args: [101] },
    ])
  })
})
