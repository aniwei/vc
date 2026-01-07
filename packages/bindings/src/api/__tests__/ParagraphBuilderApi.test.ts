import { describe, expect, it } from 'vitest'

import { ParagraphBuilderApi } from '../ParagraphBuilderApi'
import { TextAlign } from '../../enums'
import { createMockWasmApi } from './mockWasmApi'

describe('ParagraphBuilderApi', () => {
  it('forwards calls and coerces args', () => {
    const { wasm, calls } = createMockWasmApi({
      returns: {
        MakeParagraphBuilder: 1,
        MakeParagraphBuilderWithEllipsis: 2,
        ParagraphBuilder_build: 3,
      },
    })

    const api = new ParagraphBuilderApi(wasm)
    expect(api.make(-1 as any, 2.9, '12' as any, -2, TextAlign.Right, 3.1 as any)).toBe(1)
    expect(api.makeWithEllipsis(1 as any, 2, 12, 0xff000000, TextAlign.Left, 3, -3 as any, 4.9 as any)).toBe(2)
    api.pushStyle(-4 as any, '14' as any, -5)
    api.addText(-6 as any, -7 as any, 8.9)
    api.pop(-8 as any)
    expect(api.build(-9 as any, '300.5' as any)).toBe(3)
    api.delete(-10 as any)

    expect(calls).toEqual([
      { name: 'MakeParagraphBuilder', args: [0xffffffff, 2, 12, 0xfffffffe, 1, 3] },
      { name: 'MakeParagraphBuilderWithEllipsis', args: [1, 2, 12, 0xff000000, 0, 3, 0xfffffffd, 4] },
      { name: 'ParagraphBuilder_pushStyle', args: [0xfffffffc, 14, 0xfffffffb] },
      { name: 'ParagraphBuilder_addText', args: [0xfffffffa, 0xfffffff9, 8] },
      { name: 'ParagraphBuilder_pop', args: [0xfffffff8] },
      { name: 'ParagraphBuilder_build', args: [0xfffffff7, 300.5] },
      { name: 'DeleteParagraphBuilder', args: [0xfffffff6] },
    ])
  })
})
