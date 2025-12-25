/**
 * WebGL function imports for CanvasKit
 * 
 * CanvasKit requires WebGL functions to be imported from JavaScript.
 * This module provides the mapping between emscripten WebGL calls
 * and actual browser WebGL API.
 */

// WebGL context storage
const contexts: Map<int32, WebGLRenderingContext | WebGL2RenderingContext> = new Map()
let nextContextHandle = 1

/**
 * Create a WebGL context for the given canvas
 */
export function emscripten_webgl_create_context(
  canvasSelector: pointer<char>,
  attributes: pointer<void>
): int32 {
  // For CanvasKit, we'll typically pass the canvas element directly
  // In the actual implementation, this would be called from C++ side
  // We return a context handle that maps to the WebGL context
  return 0 // Will be set up properly when surface is created
}

/**
 * Make a WebGL context current
 */
export function emscripten_webgl_make_context_current(contextHandle: int32): int32 {
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
  contextHandle: int32,
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
    emscripten_webgl_get_current_context: (): int32 => {
      // Return handle of current context
      return contexts.size > 0 ? 1 : 0
    },
    emscripten_webgl_destroy_context: (contextHandle: int32): int32 => {
      contexts.delete(contextHandle)
      return 0
    },
    
    // GL function wrappers - these will call into the actual WebGL context
    glClear: (mask: uint32) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.clear(mask)
    },
    
    glClearColor: (r: float, g: float, b: float, a: float) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.clearColor(r, g, b, a)
    },
    
    glViewport: (x: int32, y: int32, width: int32, height: int32) => {
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
    
    glEnable: (cap: uint32) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.enable(cap)
    },
    
    glDisable: (cap: uint32) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.disable(cap)
    },
    
    glBlendFunc: (sfactor: uint32, dfactor: uint32) => {
      const ctx = getCurrentContext()
      if (ctx) ctx.blendFunc(sfactor, dfactor)
    },
    
    glBindTexture: (target: uint32, texture: uint32) => {
      const ctx = getCurrentContext()
      // Texture handling would need proper WebGLTexture object mapping
      if (ctx) ctx.bindTexture(target, null)
    },
    
    // Add more GL functions as needed by CanvasKit
    // The full set would include all GL ES 2.0/3.0 functions used by Skia
  }
}
