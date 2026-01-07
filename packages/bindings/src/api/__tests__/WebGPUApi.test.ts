import { describe, expect, it } from 'vitest'

import { WebGPUApi } from '../WebGPUApi'
import { createMockWasmApi } from './mockWasmApi'

describe('WebGPUApi', () => {
  it('hasWebGPU: true when export exists', () => {
    const { wasm } = createMockWasmApi({
      exports: {
        MakeGPUTextureSurface: () => 1,
      },
    })

    const api = new WebGPUApi(wasm)
    expect(api.hasWebGPU()).toBe(true)
  })

  it('makeGPUTextureSurface: forwards args and returns ptr', () => {
    const calls: any[] = []

    const { wasm } = createMockWasmApi({
      exports: {
        MakeGPUTextureSurface: (handle: number, format: number, w: number, h: number) => {
          calls.push([handle, format, w, h])
          return 99
        },
      },
    })

    const api = new WebGPUApi(wasm)
    const ptr = api.makeGPUTextureSurface(10, 20, 640, 480)

    expect(ptr).toBe(99)
    expect(calls).toEqual([[10, 20, 640, 480]])
  })
})
