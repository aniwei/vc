import { beforeAll, describe, expect, it } from 'vitest'

import { Rect } from 'geometry'

import { Surface } from '../Surface'
import { Paint } from '../Paint'
import { Path } from '../Path'
import { Shader } from '../Shader'
import { PathEffect } from '../PathEffect'
import { PaintStyle } from '../enums'
import { ensureCanvasKitReady } from './helpers/ensureCanvasKit'

function countUniqueColorsSampled(rgba: Uint8Array, w: number, h: number, step: number = 4): number {
  const set = new Set<number>()
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const off = (y * w + x) * 4
      const r = rgba[off + 0]!
      const g = rgba[off + 1]!
      const b = rgba[off + 2]!
      const a = rgba[off + 3]!
      if (a === 0) continue
      const key = ((r >> 4) << 12) | ((g >> 4) << 8) | ((b >> 4) << 4) | (a >> 4)
      set.add(key)
    }
  }
  return set.size
}

describe('Path/Shader/PathEffect (integration)', () => {
  beforeAll(async () => {
    await ensureCanvasKitReady()
  })

  it('path bounds and snapshot transform work', () => {
    const p = new Path()
    p.addRect(new Rect(10, 10, 20, 30))
    const b0 = p.getBounds()
    expect(b0.left).toBeCloseTo(10)
    expect(b0.top).toBeCloseTo(10)
    expect(b0.right).toBeCloseTo(20)
    expect(b0.bottom).toBeCloseTo(30)

    const snap = p.snapshot()
    snap.transform([
      1, 0, 5,
      0, 1, 6,
      0, 0, 1,
    ])
    const b1 = snap.getBounds()
    expect(b1.left).toBeCloseTo(15)
    expect(b1.top).toBeCloseTo(16)

    snap.dispose()
    p.dispose()
  })

  it('shader + pathEffect are accepted and rendering produces multiple colors', () => {
    const w = 64
    const h = 32
    const surface = Surface.makeSw(w, h)

    const shader = Shader.makeLinearGradient(0, 0, w, 0, [0xffff0000, 0xff0000ff])
    const effect = PathEffect.makeDash([4, 2], 0)

    const paint = new Paint()
      .setAntiAlias(false)
      .setStyle(PaintStyle.Stroke)
      .setStrokeWidth(4)
      .setShader(shader.raw)
      .setPathEffect(effect.raw)

    const path = new Path()
    path.moveTo(2, h / 2)
    path.lineTo(w - 2, h / 2)

    surface.canvas.clear(0xff000000)
    surface.canvas.drawPath(path, paint)
    surface.flush()

    const rgba = surface.readPixelsRgba8888(0, 0, w, h)
    expect(countUniqueColorsSampled(rgba, w, h)).toBeGreaterThan(1)

    path.dispose()
    paint.dispose()
    effect.dispose()
    shader.dispose()
    surface.dispose()
  })
})
