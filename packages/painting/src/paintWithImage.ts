import { Canvas, Image, Rect, Size, Offset } from 'bindings'
import { Alignment } from './Alignment'
import { BoxFit, applyBoxFit } from './BoxFit'
import { ImageRepeat } from './DecorationImage'
import { scaleRect } from './Transform'
import { createImageTileRects } from './createImageTileRects'

export type LTRBRect = readonly [number, number, number, number]

function toLTRB(rect: Rect): LTRBRect {
  return [rect.left, rect.top, rect.right, rect.bottom]
}

export function paintWithImage(
  canvas: Canvas,
  rect: Rect,
  image: Image,
  scale: number = 1.0,
  opacity: number = 1.0,
  _filter: unknown = null,
  fit: BoxFit | null = null,
  alignment: Alignment = Alignment.CENTER,
  center: Rect | null = null,
  repeat: ImageRepeat = ImageRepeat.NoRepeat,
  flipHorizontally: boolean = false,
  _invertColors: boolean = false,
  _quality: unknown = null,
  _isAntiAlias: boolean = false,
) {
  if (rect.isEmpty) {
    return
  }

  let output = rect.size
  let input = Size.create(image.width, image.height)
  let slice: Size | null = null

  if (center !== null) {
    slice = input.divide(scale).subtract(center.size)
    output = output.subtract(slice)
    input = input.subtract(slice.multiply(scale))
  }

  fit ??= center == null ? BoxFit.ScaleDown : BoxFit.Fill

  const fittedSizes = applyBoxFit(fit, input.divide(scale), output)
  const source = fittedSizes.source.multiply(scale)
  let destination = fittedSizes.destination

  if (center !== null) {
    output = output.add(slice!)
    destination = destination.add(slice!)
  }

  if (repeat !== ImageRepeat.NoRepeat && destination.equal(output)) {
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
  const dx = halfWidthDelta + alignment.x * halfWidthDelta
  const dy = halfHeightDelta + alignment.y * halfHeightDelta
  const destinationPosition: Offset = rect.topLeft.translate(dx, dy)
  const destinationRect = destinationPosition.and(destination)

  const saved = center !== null || repeat !== ImageRepeat.NoRepeat || flipHorizontally
  if (saved) {
    canvas.save()
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
    canvas.scale(1 / scale, 1)
    if (repeat === ImageRepeat.NoRepeat) {
      canvas.drawImageNine(image, toLTRB(scaleRect(center, scale)), toLTRB(scaleRect(destinationRect, scale)), paint)
    } else {
      for (const tileRect of createImageTileRects(rect, destinationRect, repeat)) {
        canvas.drawImageNine(image, toLTRB(scaleRect(center, scale)), toLTRB(scaleRect(tileRect, scale)), paint)
      }
    }
  }

  if (saved) {
    canvas.restore()
  }
}
