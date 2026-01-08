import { describe, expect, it } from 'vitest'

import { WebGLApi } from '../WebGLApi'
import { getCanvasKit } from './getCanvasKit'

describe('WebGLApi', () => {
  it('hasWebGL matches export availability', async () => {
    const wasm = await getCanvasKit()
    const api = new WebGLApi(wasm)

    const expected = wasm.hasExport('WebGL_CreateContext') && wasm.hasExport('WebGL_MakeContextCurrent')
    expect(api.hasWebGL()).toBe(expected)
  })
})
