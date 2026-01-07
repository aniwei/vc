import { describe, expect, it } from 'vitest'

import { ShaderApi } from '../ShaderApi'
import { TileMode } from '../../enums'
import { createMockWasmApi } from './mockWasmApi'

describe('ShaderApi', () => {
  it('forwards calls and coerces args', () => {
    const { wasm, calls } = createMockWasmApi({
      returns: {
        MakeColorShader: 11,
        MakeLinearGradientShader: 22,
      },
    })

    const api = new ShaderApi(wasm)
    expect(api.makeColor(-1)).toBe(11)
    expect(api.makeLinearGradient(1, '2' as any, 3, 4.5, -1 as any, -2 as any, 2.9, TileMode.Clamp)).toBe(22)
    api.delete(-3 as any)

    expect(calls).toEqual([
      { name: 'MakeColorShader', args: [0xffffffff] },
      { name: 'MakeLinearGradientShader', args: [1, 2, 3, 4.5, 0xffffffff, 0xfffffffe, 2, 0] },
      { name: 'DeleteShader', args: [0xfffffffd] },
    ])
  })
})
