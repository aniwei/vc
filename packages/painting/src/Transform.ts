import { Rect } from 'bindings'

export function scaleRect(rect: Rect, scale: number): Rect {
  return Rect.fromLTWH(rect.left * scale, rect.top * scale, rect.width * scale, rect.height * scale)
}
