import { Rect, Size, Offset } from 'geometry'
import type { CanvasLike, LTRBRect } from './CanvasLike'
import { Alignment } from './Alignment'
import { BoxFit, applyBoxFit } from './BoxFit'
import { ImageRepeat } from './DecorationImage'
import { scaleRect } from './Transform'
import { createImageTileRects } from './createImageTileRects'

function toLTRB(rect: Rect): LTRBRect {
  return [rect.left, rect.top, rect.right, rect.bottom]
}

export function paintWithImage(
  canvas: CanvasLike,
  rect: Rect,
  image: { width: number; height: number } & unknown,
  scale: number = 1.0,
  opacity: number = 1.0,
  _filter: unknown = null,
  fit: BoxFit | null = null,
  alignment: Alignment = Alignment.Center,
  center: Rect | null = null,
  repeat: ImageRepeat = ImageRepeat.NoRepeat,
  flipHorizontally: boolean = false,
  _invertColors: boolean = false,
  _quality: unknown = null,
  _isAntiAlias: boolean = false,
) {
  if (rect.isEmpty()) {
    return
  }

  let output = rect.size
  let input = new Size(image.width, image.height)
  let slice: Size | null = null

  if (center !== null) {
    slice = input.div(scale).sub(center.size)
    output = output.sub(slice)
    input = input.sub(slice.mul(scale))
  }

  fit ??= center == null ? BoxFit.ScaleDown : BoxFit.Fill

  const fittedSizes = applyBoxFit(fit, input.div(scale), output)
  const source = fittedSizes.source.mul(scale)
  let destination = fittedSizes.destination

  if (center !== null) {
    output = output.add(slice!)
    destination = destination.add(slice!)
  }

  if (repeat !== ImageRepeat.NoRepeat && destination.eq(output)) {
    repeat = ImageRepeat.NoRepeat
  }

  const paint = { opacity }

  if (flipHorizontally) {
    const dx = -(rect.left + rect.width / 2)
    canvas.translate(-dx, 0)
    canvas.scale(-1, 1)
    canvas.translate(dx, 0)
  }

  const sourceRect = alignment.inscribe(source, Offset.ZERO.and(input))
  const halfWidthDelta = (output.width - destination.width) / 2
  const halfHeightDelta = (output.height - destination.height) / 2
  const dx = halfWidthDelta + (flipHorizontally ? -alignment.x : alignment.x) * halfWidthDelta
  const dy = halfHeightDelta + alignment.y * halfHeightDelta
  const destinationPosition: Offset = rect.topLeft.translate(dx, dy)
  const destinationRect = destinationPosition.and(destination)

  const saved = center !== null || repeat !== ImageRepeat.NoRepeat || flipHorizontally
  if (saved) {
    canvas.save()
  }

  if (repeat !== ImageRepeat.NoRepeat) {
    // Clip to the destination rect to avoid drawing tiles outside.
    canvas.clipRect(toLTRB(rect))
  }

  if (center === null) {
    if (repeat === ImageRepeat.NoRepeat) {
      canvas.drawImageRect(image, toLTRB(sourceRect), toLTRB(destinationRect), paint)
    } else {
      for (const tileRect of createImageTileRects(rect, destinationRect, repeat)) {
        canvas.drawImageRect(image, toLTRB(sourceRect), toLTRB(tileRect), paint)
      }
    }
  } else {
    const drawNine = canvas.drawImageNine

    // Some Canvas adapters (e.g. ui/CanvasLike) only implement drawImageRect.
    // If 9-slice isn't available, fall back to normal drawImageRect (ignore center).
    if (typeof drawNine !== 'function') {
      if (repeat === ImageRepeat.NoRepeat) {
        canvas.drawImageRect(image, toLTRB(sourceRect), toLTRB(destinationRect), paint)
      } else {
        for (const tileRect of createImageTileRects(rect, destinationRect, repeat)) {
          canvas.drawImageRect(image, toLTRB(sourceRect), toLTRB(tileRect), paint)
        }
      }
    } else {
      canvas.scale(1 / scale, 1 / scale)
      if (repeat === ImageRepeat.NoRepeat) {
        drawNine(image, toLTRB(scaleRect(center, scale)), toLTRB(scaleRect(destinationRect, scale)), paint)
      } else {
        for (const tileRect of createImageTileRects(rect, destinationRect, repeat)) {
          drawNine(image, toLTRB(scaleRect(center, scale)), toLTRB(scaleRect(tileRect, scale)), paint)
        }
      }
    }
  }

  if (saved) {
    canvas.restore()
  }
}
