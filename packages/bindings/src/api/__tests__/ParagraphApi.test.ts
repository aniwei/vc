import { describe, expect, it } from 'vitest'

import fs from 'node:fs/promises'
import path from 'node:path'

import { ParagraphApi } from '../ParagraphApi'
import { TextAlign } from '../../enums'
import { getCanvasKit } from './getCanvasKit'

async function loadTestFontBytes(): Promise<Uint8Array> {
  const fontPath =
    process.env.CANVASKIT_TEST_FONT ||
    path.resolve(__dirname, '../../../../third-party/skia/resources/fonts/DejaVuSans.subset.ttf')
  const buf = await fs.readFile(fontPath)
  return new Uint8Array(buf)
}

describe('ParagraphApi', () => {
  it('creates a paragraph from text and measures', async () => {
    const wasm = await getCanvasKit()
    const api = new ParagraphApi(wasm)

    const fontBytes = await loadTestFontBytes()
    const textBytes = new TextEncoder().encode('hello')

    const fontPtr = wasm.allocBytes(fontBytes)
    const textPtr = wasm.allocBytes(textBytes)

    const p = api.makeFromText(
      textPtr,
      textBytes.length,
      fontPtr,
      fontBytes.length,
      20,
      200,
      0xff000000,
      TextAlign.Left,
      1,
    )

    wasm.free(fontPtr)
    wasm.free(textPtr)

    expect(p).toBeTruthy()
    api.layout(p, 200)
    expect(api.getHeight(p)).toBeGreaterThan(0)
    expect(api.getMaxWidth(p)).toBeGreaterThan(0)
    expect(api.getLongestLine(p)).toBeGreaterThan(0)
    api.delete(p)
  })
})
