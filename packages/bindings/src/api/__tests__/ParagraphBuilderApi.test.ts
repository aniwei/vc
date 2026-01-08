import { describe, expect, it } from 'vitest'

import fs from 'node:fs/promises'
import path from 'node:path'

import { ParagraphBuilderApi } from '../ParagraphBuilderApi'
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

describe('ParagraphBuilderApi', () => {
  it('builds a paragraph via builder', async () => {
    const wasm = await getCanvasKit()
    const builderApi = new ParagraphBuilderApi(wasm)
    const paragraphApi = new ParagraphApi(wasm)

    const fontBytes = await loadTestFontBytes()
    const fontPtr = wasm.allocBytes(fontBytes)

    const builder = builderApi.make(fontPtr, fontBytes.length, 18, 0xff000000, TextAlign.Left, 1)
    wasm.free(fontPtr)

    expect(builder).toBeTruthy()

    const textBytes = new TextEncoder().encode('ab')
    const textPtr = wasm.allocBytes(textBytes)
    builderApi.pushStyle(builder, 18, 0xff00ff00)
    builderApi.addText(builder, textPtr, textBytes.length)
    builderApi.pop(builder)
    wasm.free(textPtr)

    const paragraph = builderApi.build(builder, 200)
    expect(paragraph).toBeTruthy()

    paragraphApi.layout(paragraph, 200)
    expect(paragraphApi.getHeight(paragraph)).toBeGreaterThan(0)
    paragraphApi.delete(paragraph)
  })
})
