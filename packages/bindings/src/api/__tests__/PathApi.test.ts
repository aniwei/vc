import { describe, expect, it } from 'vitest'

import { PathApi } from '../PathApi'
import { PathFillType } from '../../enums'
import { getCanvasKit } from './getCanvasKit'

describe('PathApi', () => {
  it('creates a path and (optionally) reads bounds', async () => {
    const wasm = await getCanvasKit()
    const api = new PathApi(wasm)

    const path = api.make()
    expect(path).toBeTruthy()

    api.setFillType(path, PathFillType.EvenOdd)
    api.moveTo(path, '1' as any, '2.5' as any)
    api.lineTo(path, 10, 20)

    // snapshot yields an SkPath* that can be queried/transformed
    const skPath = api.snapshot(path)
    expect(skPath).toBeTruthy()

    if (wasm.hasExport('SkPath_getBounds')) {
      const out = wasm.malloc(16)
      api.getSkPathBounds(skPath, out)
      const l = wasm.getFloat32(out, true)
      const t = wasm.getFloat32(out + 4, true)
      const r = wasm.getFloat32(out + 8, true)
      const b = wasm.getFloat32(out + 12, true)
      wasm.free(out)
      expect(r).toBeGreaterThanOrEqual(l)
      expect(b).toBeGreaterThanOrEqual(t)
    }

    api.deleteSkPath(skPath)
    api.delete(path)
  })
})
