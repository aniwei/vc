import { describe, expect, it } from 'vitest'

import { PathApi } from '../PathApi'
import { PathFillType } from '../../enums'
import { createMockWasmApi } from './mockWasmApi'

describe('PathApi', () => {
  it('forwards calls and coerces args', () => {
    const { wasm, calls } = createMockWasmApi({
      returns: {
        MakePath: 111,
        Path_snapshot: 222,
      },
    })

    const api = new PathApi(wasm)
    expect(api.make()).toBe(111)
    api.setFillType(1 as any, PathFillType.EvenOdd)
    api.moveTo(2 as any, '1' as any, '2.5' as any)
    api.addOval(3 as any, 1, 2, 3, 4, 1.9 as any, 2.1 as any)
    api.addPolygon(4 as any, -1 as any, 3.9 as any, true)
    api.arcToOval(5 as any, 1, 2, 3, 4, 5, 6, true)
    expect(api.snapshot(6 as any)).toBe(222)
    api.transform(7 as any, -2 as any)
    api.deleteSkPath(8 as any)
    api.delete(9 as any)

    expect(calls).toEqual([
      { name: 'MakePath', args: [] },
      { name: 'Path_setFillType', args: [1, 1] },
      { name: 'Path_moveTo', args: [2, 1, 2.5] },
      { name: 'Path_addOval', args: [3, 1, 2, 3, 4, 1, 2] },
      { name: 'Path_addPolygon', args: [4, 0xffffffff, 3, 1] },
      { name: 'Path_arcToOval', args: [5, 1, 2, 3, 4, 5, 6, 1] },
      { name: 'Path_snapshot', args: [6] },
      { name: 'Path_transform', args: [7, 0xfffffffe] },
      { name: 'DeleteSkPath', args: [8] },
      { name: 'DeletePath', args: [9] },
    ])
  })
})
