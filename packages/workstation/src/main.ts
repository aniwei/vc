import { CanvasKitApi, Surface, Paint, PaintStyle } from 'bindings'
import * as UI from 'ui'
import { Offset, Rect, Size } from 'geometry'

class DemoPainter extends UI.CustomBoxPainter {
  paint(context: any, size: Size, offset: Offset): void {
    const canvas = context.canvas
    if (!canvas) return

    canvas.clear(0xff0b0f14)

    const bgPaint = new Paint().setStyle(PaintStyle.Fill).setColor(0xff1f2937)
    const fgPaint = new Paint().setStyle(PaintStyle.Fill).setColor(0xff22c55e)

    try {
      const outer = Rect.fromLTWH(offset.dx, offset.dy, size.width, size.height)
      const inner = Rect.fromLTWH(offset.dx + 16, offset.dy + 16, Math.max(0, size.width - 32), 56)
      canvas.drawRect(outer, bgPaint)
      canvas.drawRect(inner, fgPaint)
    } finally {
      bgPaint.dispose()
      fgPaint.dispose()
    }
  }
}

class FillBox extends UI.CustomBox<DemoPainter> {
  override layout(constraints: any): void {
    this.constraints = constraints
    this.size = new Size(constraints.maxWidth, constraints.maxHeight)
    this.needsLayout = false
  }
}

async function main() {
  const canvasEl = document.getElementById('app') as HTMLCanvasElement | null
  if (!canvasEl) throw new Error('Missing #app canvas')

  const ctx2d = canvasEl.getContext('2d')
  if (!ctx2d) throw new Error('canvas.getContext(\'2d\') returned null')

  await CanvasKitApi.ready({ uri: '/cheap/canvaskit.wasm' })

  const W = canvasEl.width | 0
  const H = canvasEl.height | 0

  const surface = Surface.makeSw(W, H)
  const view = new UI.View(new UI.ViewConfiguration(W, H, window.devicePixelRatio))
  view.adoptChild(new FillBox(new DemoPainter(), null))

  const renderOnce = () => {
    view.frame(surface.canvas)

    const bytes = surface.readPixelsRgba8888(0, 0, W, H)
    const img = new ImageData(new Uint8ClampedArray(bytes.buffer, bytes.byteOffset, bytes.byteLength), W, H)
    ctx2d.putImageData(img, 0, 0)
  }

  renderOnce()
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
})
