/**
 * Path bindings for CanvasKit
 * 
 * Provides JavaScript wrapper for SkPath C API
 */

import type CanvasKitRunner from '../CanvasKitRunner'
import type { Path as IPath } from '../types'

export class Path implements IPath {
  private runner: CanvasKitRunner
  private pointer: pointer<void>
  
  constructor(runner: CanvasKitRunner) {
    this.runner = runner
    // Call C function: void* MakePath()
    this.pointer = this.runner.invokeCanvasKit<pointer<void>>('MakePath')
    
    if (this.pointer === nullptr) {
      throw new Error('Failed to create Path object')
    }
  }
  
  /**
   * Move to a point
   * Calls C function: void Path_moveTo(void* path, float x, float y)
   */
  moveTo(x: float, y: float): void {
    this.runner.invokeCanvasKit('Path_moveTo', this.pointer, x, y)
  }
  
  /**
   * Draw a line to a point
   * Calls C function: void Path_lineTo(void* path, float x, float y)
   */
  lineTo(x: float, y: float): void {
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
    if (this.pointer !== nullptr) {
      this.runner.invokeCanvasKit('DeletePath', this.pointer)
      this.pointer = nullptr
    }
  }
  
  /**
   * Get the native pointer (for internal use)
   */
  getPointer(): pointer<void> {
    return this.pointer
  }
}
