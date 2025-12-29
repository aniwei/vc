import { Canvas, ClipOp, Image, FilterMode, MipmapMode, Rect, Size, Offset, LTRBRect, Paint } from 'bindings'
import invariant from 'invariant'
import { Alignment } from './Alignment'
import { BoxFit, applyBoxFit } from './BoxFit'
import { ImageRepeat } from './DecorationImage'
import { scaleRect } from './Transform'
import { createImageTileRects } from './createImageTileRects'

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

  const effectiveFit = fit ?? (center == null ? BoxFit.ScaleDown : BoxFit.Fill)
  invariant(
    center === null || (effectiveFit !== BoxFit.None && effectiveFit !== BoxFit.Cover),
    'centerSlice cannot be used with BoxFit.None or BoxFit.Cover',
  )

  const fittedSizes = applyBoxFit(effectiveFit, input.div(scale), output)
  const source = fittedSizes.source.mul(scale)
  let destination = fittedSizes.destination

  if (center !== null) {
    output = output.add(slice!)
    destination = destination.add(slice!)
  }

  if (repeat !== ImageRepeat.NoRepeat && destination.eq(output)) {
    repeat = ImageRepeat.NoRepeat
  }

  let filterMode: FilterMode | undefined
  let mipmapMode: MipmapMode | undefined

  if (typeof _quality === 'number') {
    // Allow passing FilterMode directly.
    if (_quality === FilterMode.Nearest || _quality === FilterMode.Linear) {
      filterMode = _quality
    }
  } else if (_quality && typeof _quality === 'object') {
    const q = _quality as { filterMode?: unknown; mipmapMode?: unknown }
    if (q.filterMode === FilterMode.Nearest || q.filterMode === FilterMode.Linear) {
      filterMode = q.filterMode
    }
    if (q.mipmapMode === MipmapMode.None || q.mipmapMode === MipmapMode.Nearest || q.mipmapMode === MipmapMode.Linear) {
      mipmapMode = q.mipmapMode
    }
  }

  const colorFilterPtr = typeof _filter === 'number' ? (_filter as number) : null

  // When a real paint is required (e.g. ColorFilter), use the SkPaint call path.
  // NOTE: this path currently uses the default sampling (linear/none) inside bindings.
  let skPaint: Paint | null = null
  if (colorFilterPtr && colorFilterPtr > 0) {
    skPaint = new Paint()
    skPaint.setAlphaf(opacity)
    skPaint.setColorFilter(colorFilterPtr)
  }

  const paint = skPaint ?? { opacity, filterMode, mipmapMode }

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
    canvas.clipRect(toLTRB(rect), ClipOp.Intersect, true)
  }

  if (center === null) {
    if (repeat === ImageRepeat.NoRepeat) {
      canvas.drawImageRect(image, toLTRB(sourceRect), toLTRB(destinationRect), paint as any)
    } else {
      for (const tileRect of createImageTileRects(rect, destinationRect, repeat)) {
        canvas.drawImageRect(image, toLTRB(sourceRect), toLTRB(tileRect), paint as any)
      }
    }
  } else {
    const drawNine = canvas.drawImageNine

    // Some Canvas implementations only implement drawImageRect.
    // If 9-slice isn't available, fall back to normal drawImageRect (ignore center).
    if (typeof drawNine !== 'function') {
      if (repeat === ImageRepeat.NoRepeat) {
        canvas.drawImageRect(image, toLTRB(sourceRect), toLTRB(destinationRect), paint as any)
      } else {
        for (const tileRect of createImageTileRects(rect, destinationRect, repeat)) {
          canvas.drawImageRect(image, toLTRB(sourceRect), toLTRB(tileRect), paint as any)
        }
      }
    } else {
      canvas.scale(1 / scale, 1 / scale)
      if (repeat === ImageRepeat.NoRepeat) {
        drawNine(image, toLTRB(scaleRect(center, scale)), toLTRB(scaleRect(destinationRect, scale)), paint as any)
      } else {
        for (const tileRect of createImageTileRects(rect, destinationRect, repeat)) {
          drawNine(image, toLTRB(scaleRect(center, scale)), toLTRB(scaleRect(tileRect, scale)), paint as any)
        }
      }
    }
  }

  if (saved) {
    canvas.restore()
  }

  skPaint?.dispose()
}
