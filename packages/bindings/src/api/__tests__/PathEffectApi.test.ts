import { describe, expect, it } from 'vitest'

import { PathEffectApi } from '../PathEffectApi'
import { createMockWasmApi } from './mockWasmApi'

describe('PathEffectApi', () => {
  it('forwards calls and coerces args', () => {
    const { wasm, calls } = createMockWasmApi({
      returns: {
        MakeDashPathEffect: 321,
      },
    })

    const api = new PathEffectApi(wasm)
    expect(api.makeDash(-1 as any, 2.9, '0.5' as any)).toBe(321)
    api.delete(-2 as any)

    expect(calls).toEqual([
      { name: 'MakeDashPathEffect', args: [0xffffffff, 2, 0.5] },
      { name: 'DeletePathEffect', args: [0xfffffffe] },
    ])
  })
})
