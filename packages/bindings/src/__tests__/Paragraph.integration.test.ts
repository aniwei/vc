import { beforeAll, describe, expect, it } from 'vitest'

import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { Paragraph } from '../Paragraph'
import { ParagraphBuilder } from '../ParagraphBuilder'
import { TextAlign } from '../enums'
import { ensureCanvasKitReady } from './helpers/ensureCanvasKit'

async function loadTestFontBytes(): Promise<Uint8Array> {
  const fontPath =
    process.env.CANVASKIT_TEST_FONT ||
    fileURLToPath(new URL('../../../third-party/skia/resources/fonts/DejaVuSans.subset.ttf', import.meta.url))
  const buf = await fs.readFile(fontPath)
  return new Uint8Array(buf)
}

describe('Paragraph/ParagraphBuilder (integration)', () => {
  beforeAll(async () => {
    await ensureCanvasKitReady()
  })

  it('creates paragraph from text and measures', async () => {
    const fontBytes = await loadTestFontBytes()
    const p = Paragraph.fromText('hello', {
      fontBytes,
      fontSize: 20,
      wrapWidth: 200,
      textAlign: TextAlign.Left,
    })

    p.layout(200)
    expect(p.height).toBeGreaterThan(0)
    expect(p.maxWidth).toBeGreaterThan(0)
    expect(p.longestLine).toBeGreaterThan(0)

    p.dispose()
  })

  it('builds paragraph via builder and marks builder deleted', async () => {
    const fontBytes = await loadTestFontBytes()
    const builder = ParagraphBuilder.create({ fontBytes, fontSize: 18 })
    builder.pushStyle(18, 0xff00ff00).addText('a').addText('b').pop()
    const p = builder.build(300)

    expect(builder.isDeleted()).toBe(true)
    p.layout(300)
    expect(p.height).toBeGreaterThan(0)

    p.dispose()
  })
})
