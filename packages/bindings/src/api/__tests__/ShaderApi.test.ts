import { describe, expect, it } from 'vitest'

import { ShaderApi } from '../ShaderApi'
import { TileMode } from '../../enums'
import { getCanvasKit } from './getCanvasKit'

describe('ShaderApi', () => {
  it('creates shaders from real wasm', async () => {
    const wasm = await getCanvasKit()
    const api = new ShaderApi(wasm)

    const colorShader = api.makeColor(0xff00ff00)
    expect(colorShader).toBeTruthy()
    api.delete(colorShader)

    if (!wasm.hasExport('MakeLinearGradientShader')) {
      return
    }

    const colors = new Uint32Array([0xffff0000, 0xff00ff00])
    const positions = new Float32Array([0, 1])
    const colorsPtr = wasm.malloc(colors.length * 4)
    const positionsPtr = wasm.malloc(positions.length * 4)
    wasm.setUint32Array(colorsPtr, colors)
    wasm.setFloat32Array(positionsPtr, positions)

    const shader = api.makeLinearGradient(0, 0, 10, 0, colorsPtr, positionsPtr, 2, 0)
    expect(shader).toBeTruthy()

    api.delete(shader)
    wasm.free(colorsPtr)
    wasm.free(positionsPtr)
  })
})
