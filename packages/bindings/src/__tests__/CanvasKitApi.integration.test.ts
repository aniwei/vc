import { beforeAll, describe, expect, it } from 'vitest'

import { CanvasKitApi } from '../CanvasKitApi'
import { ensureCanvasKitReady } from './helpers/ensureCanvasKit'

describe('CanvasKitApi (integration)', () => {
  beforeAll(async () => {
    await ensureCanvasKitReady()
  })

  it('loads wasm and exposes basic exports', () => {
    expect(() => CanvasKitApi.invoke('malloc', 4)).not.toThrow()

    const ptr = CanvasKitApi.malloc(16) as unknown as number
    expect(ptr).toBeGreaterThan(0)

    CanvasKitApi.setUint32(ptr, 0x12345678)
    expect(CanvasKitApi.getUint32(ptr)).toBe(0x12345678)

    CanvasKitApi.setFloat32(ptr, 1.25)
    expect(CanvasKitApi.getFloat32(ptr)).toBeCloseTo(1.25)

    CanvasKitApi.free(ptr)
  })
})
