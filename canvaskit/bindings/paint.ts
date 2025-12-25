/**
 * Paint bindings for CanvasKit
 * 
 * Provides JavaScript wrapper for SkPaint C API
 */

import type CanvasKitRunner from '../CanvasKitRunner'
import type { Paint as IPaint, ColorInt, PaintStyle } from '../types'

export class Paint implements IPaint {
  private runner: CanvasKitRunner
  private pointer: number
  
  constructor(runner: CanvasKitRunner) {
    this.runner = runner
    // Call C function: void* MakePaint()
    this.pointer = this.runner.invokeCanvasKit<number>('MakePaint')
    
    if (this.pointer === 0) {
      throw new Error('Failed to create Paint object')
    }
  }
  
  /**
   * Set the paint color
   * Calls C function: void Paint_setColor(void* paint, uint32_t color)
   */
  setColor(color: ColorInt): void {
    this.runner.invokeCanvasKit('Paint_setColor', this.pointer, color)
  }
  
  /**
   * Set anti-aliasing
   * Calls C function: void Paint_setAntiAlias(void* paint, bool aa)
   */
  setAntiAlias(aa: boolean): void {
    this.runner.invokeCanvasKit('Paint_setAntiAlias', this.pointer, aa ? 1 : 0)
  }
  
  /**
   * Set paint style (fill or stroke)
   * Calls C function: void Paint_setStyle(void* paint, int style)
   */
  setStyle(style: PaintStyle): void {
    this.runner.invokeCanvasKit('Paint_setStyle', this.pointer, style)
  }
  
  /**
   * Set stroke width
   * Calls C function: void Paint_setStrokeWidth(void* paint, float width)
   */
  setStrokeWidth(width: number): void {
    this.runner.invokeCanvasKit('Paint_setStrokeWidth', this.pointer, width)
  }
  
  /**
   * Delete the paint object
   * Calls C function: void DeletePaint(void* paint)
   */
  delete(): void {
    if (this.pointer !== 0) {
      this.runner.invokeCanvasKit('DeletePaint', this.pointer)
      this.pointer = 0
    }
  }
  
  /**
   * Get the native pointer (for internal use)
   */
  getPointer(): number {
    return this.pointer
  }
}
