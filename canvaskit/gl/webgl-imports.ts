/**
 * WebGL function imports for CanvasKit
 * 
 * CanvasKit requires WebGL functions to be imported from JavaScript.
 * This module provides the mapping between emscripten WebGL calls
 * and actual browser WebGL API.
 */

// WebGL context storage
const contexts: Map<number, WebGLRenderingContext | WebGL2RenderingContext> = new Map()
let nextContextHandle = 1

/**
 * Create a WebGL context for the given canvas
 */
export function emscripten_webgl_create_context(
  canvasSelector: number,
  attributes: number
): number {
  // For CanvasKit, we'll typically pass the canvas element directly
  // In the actual implementation, this would be called from C++ side
  // We return a context handle that maps to the WebGL context
  return 0 // Will be set up properly when surface is created
}

/**
 * Make a WebGL context current
 */
export function emscripten_webgl_make_context_current(contextHandle: number): number {
  const context = contexts.get(contextHandle)
  if (context) {
    return 0 // Success
  }
  return -1 // Error
}

/**
 * Get the current WebGL context
 */
export function getCurrentContext(): WebGLRenderingContext | WebGL2RenderingContext | null {
  // Return the most recently created context
  // In a real implementation, track the "current" context
  for (const ctx of contexts.values()) {
    return ctx
  }
  return null
}

/**
 * Register a WebGL context with a handle
 */
export function registerContext(
  contextHandle: number,
  context: WebGLRenderingContext | WebGL2RenderingContext
): void {
  contexts.set(contextHandle, context)
}

/**
 * Create WebGL function imports object
 * These will be passed to the WebAssembly module
 */
export function createWebGLImports() {
  return {
    emscripten_webgl_create_context,
    emscripten_webgl_make_context_current,
    emscripten_webgl_get_current_context: (): number => {
      // Return handle of current context
      return contexts.size > 0 ? 1 : 0
    },
    emscripten_webgl_destroy_context: (contextHandle: number): number => {
      contexts.delete(contextHandle)
      return 0
    },
    
    // GL function wrappers - these will call into the actual WebGL context
    glClear: (mask: number) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.clear(mask)
    },
    
    glClearColor: (r: number, g: number, b: number, a: number) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.clearColor(r, g, b, a)
    },
    
    glViewport: (x: number, y: number, width: number, height: number) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.viewport(x, y, width, height)
    },
    
    glFlush: () => {
      const ctx = getCurrentContext()
      if (ctx) ctx.flush()
    },
    
    glFinish: () => {
      const ctx = getCurrentContext()
      if (ctx) ctx.finish()
    },
    
    glEnable: (cap: number) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.enable(cap)
    },
    
    glDisable: (cap: number) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.disable(cap)
    },
    
    glBlendFunc: (sfactor: number, dfactor: number) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.blendFunc(sfactor, dfactor)
    },
    
    glBindTexture: (target: number, texture: number) => {
      const ctx = getCurrentContext()
      // Texture handling would need proper WebGLTexture object mapping
      if (ctx) ctx.bindTexture(target, null)
    },
    
    // Add more GL functions as needed by CanvasKit
    // The full set would include all GL ES 2.0/3.0 functions used by Skia
  }
}
