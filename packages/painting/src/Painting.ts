import { Alignment } from './Alignment'
import { BoxFit, applyBoxFit } from './BoxFit'
import { ImageRepeat } from './DecorationImage'
import { Offset, Rect, Size } from './Geometry'
import { scaleRect } from './Transform'

export type LTRBRect = readonly [number, number, number, number]

export interface CanvasLike {
  save(): void
  restore(): void
  clipRect(rect: LTRBRect, op?: unknown): void
  translate(dx: number, dy: number): void
  scale(sx: number, sy: number): void
  drawImageRect(image: unknown, src: LTRBRect, dst: LTRBRect, paint?: unknown): void
  drawImageNine(image: unknown, center: LTRBRect, dst: LTRBRect, paint?: unknown): void
}

export interface ImageLike {
  width: number
  height: number
}

function toLTRB(rect: Rect): LTRBRect {
  return [rect.left, rect.top, rect.right, rect.bottom]
}

export class Painting {
  static paintWithImage(
    canvas: CanvasLike,
    rect: Rect,
    image: ImageLike,
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
}

export function createImageTileRects(output: Rect, fundamental: Rect, repeat: ImageRepeat): Rect[] {
  if (repeat === ImageRepeat.NoRepeat || output.isEmpty || fundamental.isEmpty) {
    return [fundamental]
  }

  const result: Rect[] = []

  const repeatX = repeat === ImageRepeat.Repeat || repeat === ImageRepeat.RepeatX
  const repeatY = repeat === ImageRepeat.Repeat || repeat === ImageRepeat.RepeatY

  const startX = repeatX ? output.left - ((output.left - fundamental.left) % fundamental.width) - fundamental.width : fundamental.left
  const startY = repeatY ? output.top - ((output.top - fundamental.top) % fundamental.height) - fundamental.height : fundamental.top

  for (let y = startY; y < output.bottom; y += repeatY ? fundamental.height : output.height) {
    for (let x = startX; x < output.right; x += repeatX ? fundamental.width : output.width) {
      const tile = Rect.fromLTWH(x, y, fundamental.width, fundamental.height)
      if (tile.right <= output.left || tile.left >= output.right || tile.bottom <= output.top || tile.top >= output.bottom) {
        continue
      }
      result.push(tile)
      if (!repeatX) break
    }
    if (!repeatY) break
  }

  return result
}
