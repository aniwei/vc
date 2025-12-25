/**
 * Path bindings for CanvasKit
 * 
 * Provides JavaScript wrapper for SkPath C API
 */

import type CanvasKitRunner from '../CanvasKitRunner'
import type { Path as IPath } from '../types'

export class Path implements IPath {
  private runner: CanvasKitRunner
  private pointer: number
  
  constructor(runner: CanvasKitRunner) {
    this.runner = runner
    // Call C function: void* MakePath()
    this.pointer = this.runner.invokeCanvasKit<number>('MakePath')
    
    if (this.pointer === 0) {
      throw new Error('Failed to create Path object')
    }
  }
  
  /**
   * Move to a point
   * Calls C function: void Path_moveTo(void* path, float x, float y)
   */
  moveTo(x: number, y: number): void {
    this.runner.invokeCanvasKit('Path_moveTo', this.pointer, x, y)
  }
  
  /**
   * Draw a line to a point
   * Calls C function: void Path_lineTo(void* path, float x, float y)
   */
  lineTo(x: number, y: number): void {
    this.runner.invokeCanvasKit('Path_lineTo', this.pointer, x, y)
  }
  
  /**
   * Close the path
   * Calls C function: void Path_close(void* path)
   */
  close(): void {
    this.runner.invokeCanvasKit('Path_close', this.pointer)
  }
  
  /**
   * Reset the path
   * Calls C function: void Path_reset(void* path)
   */
  reset(): void {
    this.runner.invokeCanvasKit('Path_reset', this.pointer)
  }
  
  /**
   * Delete the path object
   * Calls C function: void DeletePath(void* path)
   */
  delete(): void {
    if (this.pointer !== 0) {
      this.runner.invokeCanvasKit('DeletePath', this.pointer)
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
