import { describe, expect, it } from 'vitest'

import { WebGPUApi } from '../WebGPUApi'
import { getCanvasKit } from './getCanvasKit'

describe('WebGPUApi', () => {
  it('hasWebGPU matches export availability', async () => {
    const wasm = await getCanvasKit()
    const api = new WebGPUApi(wasm)

    expect(api.hasWebGPU()).toBe(wasm.hasExport('MakeGPUTextureSurface'))
  })
})
