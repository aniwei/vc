import { Canvas } from 'bindings'
import { Paint, Path, PaintStyle } from 'bindings'

import { BorderSide, BorderStyle } from './Border'
import { Rect } from 'bindings'

export function paintBorderWithRectangle(
  canvas: Canvas,
  rect: Rect,
  top: BorderSide = BorderSide.NONE,
  right: BorderSide = BorderSide.NONE,
  bottom: BorderSide = BorderSide.NONE,
  left: BorderSide = BorderSide.NONE,
): void {
  const paint = new Paint().setStrokeWidth(0)
  const path = new Path()

  // top
  if (top.style === BorderStyle.Solid) {
    paint.setColor(top.color)
    path.raw.reset()
    path.raw.moveTo(rect.left, rect.top)
    path.raw.lineTo(rect.right, rect.top)

    if (top.width === 0.0) {
      paint.setStyle(PaintStyle.Stroke).setStrokeWidth(0)
    } else {
      paint.setStyle(PaintStyle.Fill).setStrokeWidth(0)
      path.raw.lineTo(rect.right - right.width, rect.top + top.width)
      path.raw.lineTo(rect.left + left.width, rect.top + top.width)
      path.raw.close()
    }

    canvas.drawPath(path, paint)
  }

  // right
  if (right.style === BorderStyle.Solid) {
    paint.setColor(right.color)
    path.raw.reset()
    path.raw.moveTo(rect.right, rect.top)
    path.raw.lineTo(rect.right, rect.bottom)

    if (right.width === 0.0) {
      paint.setStyle(PaintStyle.Stroke).setStrokeWidth(0)
    } else {
      paint.setStyle(PaintStyle.Fill).setStrokeWidth(0)
      path.raw.lineTo(rect.right - right.width, rect.bottom - bottom.width)
      path.raw.lineTo(rect.right - right.width, rect.top + top.width)
      path.raw.close()
    }

    canvas.drawPath(path, paint)
  }

  // bottom
  if (bottom.style === BorderStyle.Solid) {
    paint.setColor(bottom.color)
    path.raw.reset()
    path.raw.moveTo(rect.right, rect.bottom)
    path.raw.lineTo(rect.left, rect.bottom)

    if (bottom.width === 0.0) {
      paint.setStyle(PaintStyle.Stroke).setStrokeWidth(0)
    } else {
      paint.setStyle(PaintStyle.Fill).setStrokeWidth(0)
      path.raw.lineTo(rect.left + left.width, rect.bottom - bottom.width)
      path.raw.lineTo(rect.right - right.width, rect.bottom - bottom.width)
      path.raw.close()
    }

    canvas.drawPath(path, paint)
  }

  // left
  if (left.style === BorderStyle.Solid) {
    paint.setColor(left.color)
    path.raw.reset()
    path.raw.moveTo(rect.left, rect.bottom)
    path.raw.lineTo(rect.left, rect.top)

    if (left.width === 0.0) {
      paint.setStyle(PaintStyle.Stroke).setStrokeWidth(0)
    } else {
      paint.setStyle(PaintStyle.Fill).setStrokeWidth(0)
      path.raw.lineTo(rect.left + left.width, rect.top + top.width)
      path.raw.lineTo(rect.left + left.width, rect.bottom - bottom.width)
      path.raw.close()
    }

    canvas.drawPath(path, paint)
  }

  paint.dispose()
  path.dispose()
}

export function paintBorderWithIrregular(canvas: Canvas, shape: Path, side: BorderSide): void {
  if (side.style !== BorderStyle.Solid) return

  const paint = new Paint()
    .setColor(side.color)
    .setStyle(PaintStyle.Stroke)
    .setStrokeWidth(side.width)

  canvas.drawPath(shape, paint)
  paint.dispose()
}