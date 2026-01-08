import { describe, expect, it } from 'vitest'

import { PaintApi, StrokeCap, StrokeJoin } from '../PaintApi'
import { PaintStyle } from '../../enums'
import { getCanvasKit } from './getCanvasKit'

describe('PaintApi', () => {
  it('creates and configures a real paint', async () => {
    const wasm = await getCanvasKit()
    const api = new PaintApi(wasm)

    const paint = api.make()
    expect(paint).toBeTruthy()

    api.setColor(paint, -1)
    api.setAntiAlias(paint, true)
    api.setStyle(paint, PaintStyle.Stroke)
    api.setStrokeWidth(paint, '1.5' as any)
    api.setStrokeCap(paint, 2 as any)
    api.setStrokeJoin(paint, 1 as any)
    api.setAlphaf(paint, '0.5' as any)
    api.setBlendMode(paint, 10.9)

    api.delete(paint)
  })
})
