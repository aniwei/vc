import { describe, expect, it } from 'vitest'

import { CanvasApi } from '../CanvasApi'
import { ClipOp, FilterMode, MipmapMode } from '../../enums'
import { getCanvasKit } from './getCanvasKit'

describe('CanvasApi', () => {
  it('operates on a real canvas from wasm', async () => {
    const wasm = await getCanvasKit()

    const surface = wasm.invoke('MakeSWCanvasSurface', 16, 16) as number
    const canvas = wasm.invoke('Surface_getCanvas', surface) as number
    const paint = wasm.invoke('MakePaint') as number

    const api = new CanvasApi(wasm)

    expect(api.getSaveCount(canvas)).toBeGreaterThan(0)
    api.clear(canvas, 0xff00ff00)
    api.translate(canvas, '2' as any, '3.5' as any)
    api.clipRect(canvas, 1, 2, 3, 4, ClipOp.Intersect, true)
    api.drawRect(canvas, 0, 0, 10, 10, paint)

    // smoke: save/restore should return an integer and not throw
    const saveCount = api.save(canvas)
    expect(Number.isInteger(saveCount)).toBe(true)
    api.restoreToCount(canvas, saveCount)

    // drawImage is a no-op with image=0; should still not crash.
    api.drawImage(canvas, 0 as any, 1, 2, FilterMode.Linear, MipmapMode.Nearest)

    wasm.invoke('DeletePaint', paint)
    wasm.invoke('DeleteSurface', surface)
  })
})
