import { describe, expect, it } from 'vitest'

import { PaintApi, StrokeCap, StrokeJoin } from '../PaintApi'
import { PaintStyle } from '../../enums'
import { createMockWasmApi } from './mockWasmApi'

describe('PaintApi', () => {
  it('forwards calls and coerces args', () => {
    const { wasm, calls } = createMockWasmApi({
      returns: {
        MakePaint: 1001,
      },
    })

    const api = new PaintApi(wasm)
    expect(api.make()).toBe(1001)
    api.setColor(1 as any, -1)
    api.setAntiAlias(2 as any, true)
    api.setStyle(3 as any, PaintStyle.Stroke)
    api.setStrokeWidth(4 as any, '2.5' as any)
    api.setStrokeCap(5 as any, StrokeCap.Round)
    api.setStrokeJoin(6 as any, StrokeJoin.Bevel)
    api.setAlphaf(7 as any, '0.25' as any)
    api.setBlendMode(8 as any, 12.9)
    api.setShader(9 as any, 10 as any)
    api.setColorFilter(11 as any, 12 as any)
    api.setPathEffect(13 as any, 14 as any)
    api.delete(15 as any)

    expect(calls).toEqual([
      { name: 'MakePaint', args: [] },
      { name: 'Paint_setColor', args: [1, 0xffffffff] },
      { name: 'Paint_setAntiAlias', args: [2, 1] },
      { name: 'Paint_setStyle', args: [3, 1] },
      { name: 'Paint_setStrokeWidth', args: [4, 2.5] },
      { name: 'Paint_setStrokeCap', args: [5, 1] },
      { name: 'Paint_setStrokeJoin', args: [6, 2] },
      { name: 'Paint_setAlphaf', args: [7, 0.25] },
      { name: 'Paint_setBlendMode', args: [8, 12] },
      { name: 'Paint_setShader', args: [9, 10] },
      { name: 'Paint_setColorFilter', args: [11, 12] },
      { name: 'Paint_setPathEffect', args: [13, 14] },
      { name: 'DeletePaint', args: [15] },
    ])
  })
})
