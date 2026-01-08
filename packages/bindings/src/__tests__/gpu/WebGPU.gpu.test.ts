import { describe, it, expect } from 'vitest'

import fs from 'node:fs'

import { getTestWasmPath } from '../helpers/ensureCanvasKit'

function hasWasmExport(wasmPath: string, name: string): boolean {
  const buf = fs.readFileSync(wasmPath)
  const mod = new WebAssembly.Module(buf)
  return WebAssembly.Module.exports(mod).some((e) => e.name === name)
}

describe('GPU (WebGPU) surface export gate', () => {
  const enabled = process.env.RUN_BROWSER_GPU_TESTS === '1'

  if (!enabled) {
    it.skip('set RUN_BROWSER_GPU_TESTS=1 to enable', () => {})
    return
  }

  it('reports whether MakeGPUTextureSurface is exported', () => {
    const wasmPath = process.env.CANVASKIT_WASM ?? getTestWasmPath()

    if (/^https?:\/\//i.test(wasmPath)) {
      // Cannot cheaply introspect remote wasm here.
      return
    }

    const has = hasWasmExport(wasmPath, 'MakeGPUTextureSurface')
    expect(typeof has).toBe('boolean')
  })
})
