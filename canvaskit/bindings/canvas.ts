/**
 * Canvas bindings for CanvasKit
 * 
 * Provides JavaScript wrapper for SkCanvas C API
 */

import type CanvasKitRunner from '../CanvasKitRunner'
import type { Canvas as ICanvas, Rect, ColorInt } from '../types'
import { Paint } from './paint'
import { Path } from './path'

export class Canvas implements ICanvas {
  private runner: CanvasKitRunner
  private pointer: number
  
  constructor(runner: CanvasKitRunner, pointer: number) {
    this.runner = runner
    this.pointer = pointer
    
    if (this.pointer === 0) {
      throw new Error('Invalid canvas pointer')
    }
  }
  
  /**
   * Clear the canvas with a color
   * Calls C function: void Canvas_clear(void* canvas, uint32_t color)
   */
  clear(color: ColorInt): void {
    this.runner.invokeCanvasKit('Canvas_clear', this.pointer, color)
  }
  
  /**
   * Draw a rectangle
   * Calls C function: void Canvas_drawRect(void* canvas, float left, float top, float right, float bottom, void* paint)
   */
  drawRect(rect: Rect, paint: Paint): void {
    this.runner.invokeCanvasKit(
      'Canvas_drawRect',
      this.pointer,
      rect.left,
      rect.top,
      rect.right,
      rect.bottom,
      paint.getPointer()
    )
  }
  
  /**
   * Draw a path
   * Calls C function: void Canvas_drawPath(void* canvas, void* path, void* paint)
   */
  drawPath(path: Path, paint: Paint): void {
    this.runner.invokeCanvasKit(
      'Canvas_drawPath',
      this.pointer,
      path.getPointer(),
      paint.getPointer()
    )
  }
  
  /**
   * Draw a circle
   * Calls C function: void Canvas_drawCircle(void* canvas, float cx, float cy, float radius, void* paint)
   */
  drawCircle(cx: number, cy: number, radius: number, paint: Paint): void {
    this.runner.invokeCanvasKit(
      'Canvas_drawCircle',
      this.pointer,
      cx,
      cy,
      radius,
      paint.getPointer()
    )
  }
  
  /**
   * Save the canvas state
   * Calls C function: int Canvas_save(void* canvas)
   */
  save(): number {
    return this.runner.invokeCanvasKit<number>('Canvas_save', this.pointer)
  }
  
  /**
   * Restore the canvas state
   * Calls C function: void Canvas_restore(void* canvas)
   */
  restore(): void {
    this.runner.invokeCanvasKit('Canvas_restore', this.pointer)
  }
  
  /**
   * Translate the canvas
   * Calls C function: void Canvas_translate(void* canvas, float dx, float dy)
   */
  translate(dx: number, dy: number): void {
    this.runner.invokeCanvasKit('Canvas_translate', this.pointer, dx, dy)
  }
  
  /**
   * Scale the canvas
   * Calls C function: void Canvas_scale(void* canvas, float sx, float sy)
   */
  scale(sx: number, sy: number): void {
    this.runner.invokeCanvasKit('Canvas_scale', this.pointer, sx, sy)
  }
  
  /**
   * Rotate the canvas
   * Calls C function: void Canvas_rotate(void* canvas, float degrees)
   */
  rotate(degrees: number): void {
    this.runner.invokeCanvasKit('Canvas_rotate', this.pointer, degrees)
  }
  
  /**
   * Get the native pointer (for internal use)
   */
  getPointer(): number {
    return this.pointer
  }
}
