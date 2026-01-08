import { describe, expect, it } from 'vitest'

import { ImageApi } from '../ImageApi'
import { getCanvasKit } from './getCanvasKit'

describe('ImageApi', () => {
  it('encodes an image to PNG and decodes it back', async () => {
    const wasm = await getCanvasKit()
    const api = new ImageApi(wasm)

    const surface = wasm.invoke('MakeSWCanvasSurface', 8, 6) as number
    const image = wasm.invoke('Surface_makeImageSnapshot', surface) as number
    expect(image).toBeTruthy()

    const pngData = api.encodeToPng(image)
    expect(pngData).toBeTruthy()

    const bytesPtr = wasm.invoke('Data_bytes', pngData) as number
    const byteLen = wasm.invoke('Data_size', pngData) as number
    expect(byteLen).toBeGreaterThan(0)

    const decoded = api.makeFromEncoded(bytesPtr, byteLen)
    expect(decoded).toBeTruthy()
    expect(api.width(decoded)).toBe(8)
    expect(api.height(decoded)).toBe(6)

    api.delete(decoded)
    wasm.invoke('DeleteData', pngData)
    api.delete(image)
    wasm.invoke('DeleteSurface', surface)
  })
})
