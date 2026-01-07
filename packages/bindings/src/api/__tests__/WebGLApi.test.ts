import { describe, expect, it } from 'vitest'

import { WebGLApi } from '../WebGLApi'
import { createMockWasmApi } from './mockWasmApi'

describe('WebGLApi', () => {
  it('hasWebGL: true when required exports exist', () => {
    const { wasm } = createMockWasmApi({
      exports: {
        WebGL_CreateContext: () => 1,
        WebGL_MakeContextCurrent: () => 0,
      },
    })

    const api = new WebGLApi(wasm)
    expect(api.hasWebGL()).toBe(true)
  })

  it('hasWebGL: false when missing exports', () => {
    const { wasm } = createMockWasmApi({
      exports: {
        WebGL_CreateContext: () => 1,
      },
    })

    const api = new WebGLApi(wasm)
    expect(api.hasWebGL()).toBe(false)
  })

  it('createContext: forwards args and webgl2 flag', () => {
    const calls: any[] = []

    const { wasm } = createMockWasmApi({
      exports: {
        WebGL_CreateContext: (ptr: number, len: number, webgl2: number) => {
          calls.push([ptr, len, webgl2])
          return 123
        },
        WebGL_MakeContextCurrent: () => 0,
        WebGL_DestroyContext: () => 0,
        MakeOnScreenCanvasSurface: () => 0,
      },
    })

    const api = new WebGLApi(wasm)
    const ctx = api.createContext(0x100, 4, true)

    expect(ctx).toBe(123)
    expect(calls).toEqual([[0x100, 4, 1]])
  })

  it('makeOnScreenSurface: forwards args and returns ptr', () => {
    const { wasm } = createMockWasmApi({
      exports: {
        WebGL_CreateContext: () => 1,
        WebGL_MakeContextCurrent: () => 0,
        MakeOnScreenCanvasSurface: (w: number, h: number) => {
          expect(w).toBe(300)
          expect(h).toBe(150)
          return 0xdeadbeef >>> 0
        },
      },
    })

    const api = new WebGLApi(wasm)
    expect(api.makeOnScreenSurface(300, 150)).toBe(0xdeadbeef >>> 0)
  })
})
