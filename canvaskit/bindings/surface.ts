/**
 * Surface bindings for CanvasKit
 * 
 * Provides JavaScript wrapper for SkSurface C API
 */

import type CanvasKitRunner from '../CanvasKitRunner'
import type { Surface as ISurface } from '../types'
import { Canvas } from './canvas'

export class Surface implements ISurface {
  private runner: CanvasKitRunner
  private pointer: pointer<void>
  private canvas: Canvas | null
  
  constructor(runner: CanvasKitRunner, pointer: pointer<void>) {
    this.runner = runner
    this.pointer = pointer
    this.canvas = null
    
    if (this.pointer === nullptr) {
      throw new Error('Invalid surface pointer')
    }
  }
  
  /**
   * Get the canvas for this surface
   * Calls C function: void* Surface_getCanvas(void* surface)
   */
  getCanvas(): Canvas {
    if (!this.canvas) {
      const canvasPointer = this.runner.invokeCanvasKit<pointer<void>>(
        'Surface_getCanvas',
        this.pointer
      )
      this.canvas = new Canvas(this.runner, canvasPointer)
    }
    return this.canvas
  }
  
  /**
   * Flush pending draw operations
   * Calls C function: void Surface_flush(void* surface)
   */
  flush(): void {
    this.runner.invokeCanvasKit('Surface_flush', this.pointer)
  }
  
  /**
   * Delete the surface object
   * Calls C function: void DeleteSurface(void* surface)
   */
  delete(): void {
    if (this.pointer !== nullptr) {
      this.runner.invokeCanvasKit('DeleteSurface', this.pointer)
      this.pointer = nullptr
      this.canvas = null
    }
  }
  
  /**
   * Get the native pointer (for internal use)
   */
  getPointer(): pointer<void> {
    return this.pointer
  }
}
