/**
 * CanvasKit Integration for cheap WebAssembly Runtime
 * 
 * This module provides integration between Skia CanvasKit and the cheap
 * WebAssembly runtime, allowing CanvasKit to run using cheap's memory
 * management and threading system.
 * 
 * @example
 * ```typescript
 * import { CanvasKitInit } from '@aniwei/cheap/canvaskit'
 * 
 * const CanvasKit = await CanvasKitInit({
 *   wasmUrl: '/canvaskit.wasm'
 * })
 * 
 * const surface = CanvasKit.MakeCanvasSurface(canvas)
 * const paint = CanvasKit.MakePaint()
 * paint.setColor(CanvasKit.RED)
 * 
 * const skCanvas = surface.getCanvas()
 * skCanvas.drawRect({ left: 0, top: 0, right: 100, bottom: 100 }, paint)
 * surface.flush()
 * ```
 */

import compile from '../webassembly/compiler'
import CanvasKitRunner from './CanvasKitRunner'
import { Paint } from './bindings/paint'
import { Path } from './bindings/path'
import { Surface } from './bindings/surface'
import type { 
  CanvasKitInitOptions, 
  CanvasKitAPI, 
  CanvasKitInit as ICanvasKitInit,
  ColorInt,
  PaintStyle
} from './types'

export * from './types'
export { CanvasKitRunner } from './CanvasKitRunner'

// Color constants (ARGB format)
const RED: ColorInt = 0xFFFF0000
const GREEN: ColorInt = 0xFF00FF00
const BLUE: ColorInt = 0xFF0000FF
const YELLOW: ColorInt = 0xFFFFFF00
const CYAN: ColorInt = 0xFF00FFFF
const MAGENTA: ColorInt = 0xFFFF00FF
const WHITE: ColorInt = 0xFFFFFFFF
const BLACK: ColorInt = 0xFF000000
const TRANSPARENT: ColorInt = 0x00000000

/**
 * Color utility function - creates a color from RGBA components
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @param a Alpha component (0.0-1.0), default 1.0
 */
function Color(r: number, g: number, b: number, a: number = 1.0): ColorInt {
  const alpha = Math.round(a * 255) & 0xFF
  return ((alpha << 24) | (r << 16) | (g << 8) | b) >>> 0
}

/**
 * Color utility function - creates a color from RGBA integer components
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @param a Alpha component (0-255), default 255
 */
function ColorAsInt(r: number, g: number, b: number, a: number = 255): ColorInt {
  return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0
}

/**
 * Initialize CanvasKit with cheap WebAssembly runtime
 * 
 * @param options Initialization options
 * @returns Promise that resolves to the CanvasKit API
 */
export const CanvasKitInit: ICanvasKitInit = async (options: CanvasKitInitOptions = {}): Promise<CanvasKitAPI> => {
  
  // Validate that at least one source is provided
  if (!options.wasmUrl && !options.wasmBinary) {
    throw new Error('Either wasmUrl or wasmBinary must be provided')
  }
  
  // Compile the WebAssembly module
  const resource = await compile({
    source: options.wasmUrl || options.wasmBinary!
  })
  
  // Create the runner
  const runner = new CanvasKitRunner(resource)
  
  // Initialize the module
  await runner.run()
  
  // Create the API object
  const api: CanvasKitAPI = {
    // Factory functions
    MakePaint: () => new Paint(runner),
    
    MakePath: () => new Path(runner),
    
    MakeCanvasSurface: (canvas: HTMLCanvasElement): Surface | null => {
      runner.setCanvas(canvas)
      
      // Call C function: void* MakeCanvasSurface(int width, int height)
      const surfacePointer = runner.invokeCanvasKit<number>(
        'MakeCanvasSurface',
        canvas.width,
        canvas.height
      )
      
      if (surfacePointer === 0) {
        return null
      }
      
      return new Surface(runner, surfacePointer)
    },
    
    MakeSWCanvasSurface: (canvas: HTMLCanvasElement): Surface | null => {
      runner.setCanvas(canvas)
      
      // Call C function: void* MakeSWCanvasSurface(int width, int height)
      const surfacePointer = runner.invokeCanvasKit<number>(
        'MakeSWCanvasSurface',
        canvas.width,
        canvas.height
      )
      
      if (surfacePointer === 0) {
        return null
      }
      
      return new Surface(runner, surfacePointer)
    },
    
    // Color constants
    RED,
    GREEN,
    BLUE,
    YELLOW,
    CYAN,
    MAGENTA,
    WHITE,
    BLACK,
    TRANSPARENT,
    
    // Enums
    PaintStyle: {
      Fill: 0,
      Stroke: 1
    },
    
    // Utility functions
    Color,
    ColorAsInt
  }
  
  return api
}

export default CanvasKitInit
