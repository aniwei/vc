import { Rect } from 'bindings'
import { ImageRepeat } from './DecorationImage'

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
