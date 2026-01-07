import { describe, expect, it } from 'vitest'

import { CanvasApi } from '../CanvasApi'
import { ClipOp, FilterMode, MipmapMode } from '../../enums'
import { createMockWasmApi } from './mockWasmApi'

describe('CanvasApi', () => {
  it('forwards calls and coerces args', () => {
    const { wasm, calls } = createMockWasmApi({
      returns: {
        Canvas_getSaveCount: 7.9,
        Canvas_save: 3.2,
        Canvas_saveLayer: 11.7,
      },
    })

    const api = new CanvasApi(wasm)

    api.clear(1 as any, -1)
    expect(api.getSaveCount(2 as any)).toBe(7)
    expect(api.save(3 as any)).toBe(3)
    expect(
      api.saveLayer(4 as any, 1, 2, 3, 4, true, -5 as any),
    ).toBe(11)
    api.restoreToCount(6 as any, 9.9)
    api.translate(7 as any, '2' as any, '3.5' as any)
    api.clipRect(8 as any, 1, 2, 3, 4, ClipOp.Intersect, true)
    api.drawImage(9 as any, 10 as any, 1, 2, FilterMode.Linear, MipmapMode.Nearest)

    expect(calls).toEqual([
      { name: 'Canvas_clear', args: [1, 0xffffffff] },
      { name: 'Canvas_getSaveCount', args: [2] },
      { name: 'Canvas_save', args: [3] },
      { name: 'Canvas_saveLayer', args: [4, 1, 2, 3, 4, 1, 0xfffffffb] },
      { name: 'Canvas_restoreToCount', args: [6, 9] },
      { name: 'Canvas_translate', args: [7, 2, 3.5] },
      { name: 'Canvas_clipRect', args: [8, 1, 2, 3, 4, 1, 1] },
      { name: 'Canvas_drawImage', args: [9, 10, 1, 2, 1, 1] },
    ])
  })
})
