import { describe, expect, it } from 'vitest'

import { ParagraphApi } from '../ParagraphApi'
import { TextAlign } from '../../enums'
import { createMockWasmApi } from './mockWasmApi'

describe('ParagraphApi', () => {
  it('forwards calls and coerces args', () => {
    const { wasm, calls } = createMockWasmApi({
      returns: {
        MakeParagraphFromText: 10,
        MakeParagraphFromTextWithEllipsis: 11,
        Paragraph_getHeight: 12.5,
        Paragraph_getMaxWidth: 13.5,
        Paragraph_getMinIntrinsicWidth: 14.5,
        Paragraph_getMaxIntrinsicWidth: 15.5,
        Paragraph_getLongestLine: 16.5,
      },
    })

    const api = new ParagraphApi(wasm)
    expect(api.makeFromText(-1 as any, 3.9, -2 as any, 4.1, '12' as any, '100.5' as any, -3, TextAlign.Center, 2.2 as any)).toBe(10)
    expect(
      api.makeFromTextWithEllipsis(
        1 as any,
        2,
        3 as any,
        4,
        12,
        100,
        0xff00ff00,
        TextAlign.Left,
        1,
        5 as any,
        6.9 as any,
      ),
    ).toBe(11)
    api.layout(-4 as any, '200.25' as any)
    expect(api.getHeight(-5 as any)).toBe(12.5)
    expect(api.getMaxWidth(-6 as any)).toBe(13.5)
    expect(api.getMinIntrinsicWidth(-7 as any)).toBe(14.5)
    expect(api.getMaxIntrinsicWidth(-8 as any)).toBe(15.5)
    expect(api.getLongestLine(-9 as any)).toBe(16.5)
    api.delete(-10 as any)

    expect(calls).toEqual([
      {
        name: 'MakeParagraphFromText',
        args: [0xffffffff, 3, 0xfffffffe, 4, 12, 100.5, 0xfffffffd, 2, 2],
      },
      {
        name: 'MakeParagraphFromTextWithEllipsis',
        args: [1, 2, 3, 4, 12, 100, 0xff00ff00, 0, 1, 5, 6],
      },
      { name: 'Paragraph_layout', args: [0xfffffffc, 200.25] },
      { name: 'Paragraph_getHeight', args: [0xfffffffb] },
      { name: 'Paragraph_getMaxWidth', args: [0xfffffffa] },
      { name: 'Paragraph_getMinIntrinsicWidth', args: [0xfffffff9] },
      { name: 'Paragraph_getMaxIntrinsicWidth', args: [0xfffffff8] },
      { name: 'Paragraph_getLongestLine', args: [0xfffffff7] },
      { name: 'DeleteParagraph', args: [0xfffffff6] },
    ])
  })
})
