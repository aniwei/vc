import { beforeAll, describe, expect, it } from 'vitest'

import { Rect } from 'geometry'

import { Surface } from '../Surface'
import { Paint } from '../Paint'
import { Image } from '../Image'
import { FilterMode, MipmapMode, PaintStyle } from '../enums'
import { ensureCanvasKitReady } from './helpers/ensureCanvasKit'

function assertPngMagic(bytes: Uint8Array): void {
  const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  expect(bytes.length).toBeGreaterThanOrEqual(magic.length)
  for (let i = 0; i < magic.length; i++) {
    expect(bytes[i]).toBe(magic[i])
  }
}

function getPixelRgba(rgba: Uint8Array, w: number, x: number, y: number): [number, number, number, number] {
  const off = (y * w + x) * 4
  return [rgba[off + 0]!, rgba[off + 1]!, rgba[off + 2]!, rgba[off + 3]!]
}

describe('Surface/Image/Canvas (integration)', () => {
  beforeAll(async () => {
    await ensureCanvasKitReady()
  })

  it('draws to SW surface, reads pixels, encodes/decodes PNG', () => {
    const w = 32
    const h = 32
    const surface = Surface.makeSw(w, h)

    const paint = new Paint().setAntiAlias(false).setStyle(PaintStyle.Fill).setColor(0xffff0000)

    surface.canvas.clear(0xffffffff)
    surface.canvas.drawRect(new Rect(0, 0, w, h), paint)
    surface.flush()

    const rgba = surface.readPixelsRgba8888(0, 0, w, h)
    expect(rgba.length).toBe(w * h * 4)

    const [r, g, b, a] = getPixelRgba(rgba, w, 10, 10)
    expect(a).toBe(255)
    expect(r).toBeGreaterThan(200)
    expect(g).toBeLessThan(60)
    expect(b).toBeLessThan(60)

    const png = surface.encodeToPngBytes()
    assertPngMagic(png)

    const image = Image.makeFromEncodedBytes(png)
    expect(image.width).toBe(w)
    expect(image.height).toBe(h)

    // Smoke test: draw decoded image back.
    surface.canvas.clear(0xff000000)
    surface.canvas.drawImage(image, 0, 0, FilterMode.Nearest, MipmapMode.None)
    surface.flush()

    image.dispose()
    paint.dispose()
    surface.dispose()
  })
})
