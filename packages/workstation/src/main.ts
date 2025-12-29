import { CanvasKitApi, Surface, Paint, PaintStyle } from 'bindings'
import * as UI from 'ui'
import { Offset, Rect, Size } from 'geometry'
import { BoxBorder, BoxDecoration } from 'painting'

class DemoPainter extends UI.CustomBoxPainter {
  paint(context: any, size: Size, offset: Offset): void {
    const canvas = context.canvas
    if (!canvas) return

    const fgPaint = new Paint().setStyle(PaintStyle.Fill).setColor(0xff22c55e)
    const strokePaint = new Paint().setStyle(PaintStyle.Stroke).setStrokeWidth(2).setColor(0xff0b0f14)

    try {
      const inner = Rect.fromLTWH(offset.dx + 16, offset.dy + 16, Math.max(0, size.width - 32), 56)
      canvas.drawRect(inner, fgPaint)
      canvas.drawRect(inner, strokePaint)
    } finally {
      fgPaint.dispose()
      strokePaint.dispose()
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

  const params = new URLSearchParams(location.search)
  const preferGpu = params.get('gpu') !== '0'

  const surface = (() => {
    if (!preferGpu) return Surface.makeSw(W, H)
    try {
      return Surface.makeGl(W, H)
    } catch {
      return Surface.makeSw(W, H)
    }
  })()
  const view = new UI.View(new UI.ViewConfiguration(W, H, window.devicePixelRatio))

  let toggled = false

  const makeDecoration = () =>
    new BoxDecoration({
      color: toggled ? 0xff111827 : 0xff1f2937,
      border: BoxBorder.all(0xff94a3b8, 2),
    })

  const content = new FillBox(new DemoPainter(), null)
  const card = new UI.DecoratedBox(content, makeDecoration())

  const right = new UI.DecoratedBox(
    new FillBox(new DemoPainter(), null),
    new BoxDecoration({
      color: 0xff0b1220,
      border: BoxBorder.all(0xff334155, 2),
    }),
  )

  const row = new UI.Row([
    new UI.Expanded(card, 1),
    new UI.Expanded(right, 1),
  ])

  row.mainAxisAlignment = UI.MainAxisAlignment.SpaceEvenly
  row.crossAxisAlignment = UI.CrossAxisAlignment.Stretch

  const overlay = new UI.PositionedBox(
    new UI.DecoratedBox(
      new FillBox(new DemoPainter(), null),
      new BoxDecoration({
        color: 0x66ef4444,
        border: BoxBorder.all(0xffef4444, 2),
      }),
    ),
    null,
    12,
    12,
    null,
    160,
    72,
  )

  const stack = new UI.StackBox([row, overlay], UI.Alignment.topLeft, UI.StackFit.Expand)

  const tap = new UI.TapBox(stack, () => {
    toggled = !toggled
    card.decoration = makeDecoration()
  })

  view.adoptChild(tap)

  const blit = () => {
    const bytes = surface.readPixelsRgba8888(0, 0, W, H)
    const img = new ImageData(new Uint8ClampedArray(bytes.buffer, bytes.byteOffset, bytes.byteLength), W, H)
    ctx2d.putImageData(img, 0, 0)
  }

  const repaintIfNeeded = () => {
    // Always call frame; it internally checks dirty flags.
    const didLayout = view.pipeline.flushLayout()
    const didPaint = view.pipeline.flushPaint(surface.canvas)
    if (didLayout || didPaint) {
      blit()
    }
  }

  const raf = () => {
    repaintIfNeeded()
    requestAnimationFrame(raf)
  }

  // Initial paint.
  view.pipeline.configuration = view.configuration
  view.pipeline.setRoot(view)
  repaintIfNeeded()
  requestAnimationFrame(raf)

  canvasEl.addEventListener('click', (ev) => {
    const rect = canvasEl.getBoundingClientRect()
    const sx = rect.width > 0 ? canvasEl.width / rect.width : 1
    const sy = rect.height > 0 ? canvasEl.height / rect.height : 1
    const x = (ev.clientX - rect.left) * sx
    const y = (ev.clientY - rect.top) * sy

    view.dispatchTap(new Offset(x, y))
  })
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
})
