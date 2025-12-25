/**
 * CanvasKitRunner - WebAssembly runner for CanvasKit module
 * 
 * Extends WebAssemblyRunner to provide CanvasKit-specific functionality
 * and import mappings for WebGL and other required functions.
 */

import WebAssemblyRunner, { WebAssemblyRunnerOptions } from '../webassembly/WebAssemblyRunner'
import type { WebAssemblyResource } from '../webassembly/compiler'
import { createWebGLImports, registerContext } from './gl/webgl-imports'

export interface CanvasKitRunnerOptions extends WebAssemblyRunnerOptions {
  canvas?: HTMLCanvasElement
}

export default class CanvasKitRunner extends WebAssemblyRunner {
  
  private canvas: HTMLCanvasElement | null
  private glContext: WebGLRenderingContext | WebGL2RenderingContext | null
  
  constructor(resource: WebAssemblyResource, options: CanvasKitRunnerOptions = {}) {
    // Merge WebGL imports with default imports
    const webglImports = createWebGLImports()
    
    const mergedOptions: WebAssemblyRunnerOptions = {
      ...options,
      imports: {
        ...options.imports,
        env: {
          ...(options.imports?.env || {}),
          ...webglImports
        }
      }
    }
    
    super(resource, mergedOptions)
    
    this.canvas = options.canvas || null
    this.glContext = null
  }
  
  /**
   * Initialize the CanvasKit module
   * Sets up WebGL context if a canvas is provided
   */
  async run(): Promise<void> {
    await super.run()
    
    // If canvas is provided, set up WebGL context
    if (this.canvas) {
      this.initializeWebGL()
    }
  }
  
  /**
   * Initialize WebGL context for the canvas
   */
  private initializeWebGL(): void {
    if (!this.canvas) return
    
    // Try to get WebGL2 context first, fallback to WebGL1
    this.glContext = this.canvas.getContext('webgl2') || 
                     this.canvas.getContext('webgl') || 
                     this.canvas.getContext('experimental-webgl') as WebGLRenderingContext
    
    if (!this.glContext) {
      throw new Error('Unable to initialize WebGL context')
    }
    
    // Register the context with handle 1 (default context)
    registerContext(1, this.glContext)
  }
  
  /**
   * Set the canvas element
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.initializeWebGL()
  }
  
  /**
   * Get the WebGL context
   */
  getGLContext(): WebGLRenderingContext | WebGL2RenderingContext | null {
    return this.glContext
  }
  
  /**
   * Get the canvas element
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas
  }
  
  /**
   * Invoke a CanvasKit C function
   * This is a convenience wrapper around the base invoke method
   */
  invokeCanvasKit<T = any>(functionName: string, ...args: any[]): T {
    return this.invoke(functionName, ...args)
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.glContext = null
    this.canvas = null
  }
}
