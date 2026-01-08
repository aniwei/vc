import { describe, expect, it } from 'vitest'

import { PathEffectApi } from '../PathEffectApi'
import { getCanvasKit } from './getCanvasKit'

describe('PathEffectApi', () => {
  it('makeDash depends on wasm exports', async () => {
    const wasm = await getCanvasKit()
    const api = new PathEffectApi(wasm)

    if (!wasm.hasExport('MakeDashPathEffect')) {
      expect(() => api.makeDash(0 as any, 2, 0.5)).toThrow(/Wasm export not found/i)
      return
    }

    const intervals = new Float32Array([2, 1])
    const ptr = wasm.malloc(intervals.length * 4)
    wasm.setFloat32Array(ptr, intervals)
    const pe = api.makeDash(ptr, intervals.length, 0)
    wasm.free(ptr)

    expect(pe).toBeTruthy()

    if (wasm.hasExport('DeletePathEffect')) {
      api.delete(pe)
    }
  })
})
