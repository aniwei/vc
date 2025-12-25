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
let currentContextHandle = 0

/**
 * Create a WebGL context for the given canvas
 */
export function emscripten_webgl_create_context(
  canvasSelector: number,
  attributes: number
): number {
  // Allocate a new context handle
  const handle = nextContextHandle++
  // The actual context will be set when registerContext is called
  return handle
}

/**
 * Make a WebGL context current
 */
export function emscripten_webgl_make_context_current(contextHandle: number): number {
  const context = contexts.get(contextHandle)
  if (context) {
    currentContextHandle = contextHandle
    return 0 // Success
  }
  return -1 // Error
}

/**
 * Get the current WebGL context
 */
export function getCurrentContext(): WebGLRenderingContext | WebGL2RenderingContext | null {
  if (currentContextHandle === 0) {
    // If no current context, try to use the first available
    for (const [handle, ctx] of contexts.entries()) {
      currentContextHandle = handle
      return ctx
    }
    return null
  }
  return contexts.get(currentContextHandle) || null
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
      if (ctx) {
        // TODO: Implement proper texture handle to WebGLTexture mapping
        // For now, we pass null which unbinds any texture
        // A complete implementation would maintain a Map<number, WebGLTexture>
        ctx.bindTexture(target, null)
      }
    },
    
    // Add more GL functions as needed by CanvasKit
    // The full set would include all GL ES 2.0/3.0 functions used by Skia
  }
}
