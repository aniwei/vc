/**
 * CanvasKit Example Usage
 * 
 * This file demonstrates various usage patterns for CanvasKit
 * integrated with the cheap WebAssembly runtime.
 */

import { CanvasKitInit } from '@aniwei/cheap/canvaskit'
import type { CanvasKitAPI, Surface, Paint, Path } from '@aniwei/cheap/canvaskit'

/**
 * Example 1: Basic Drawing
 * 
 * Shows how to initialize CanvasKit and draw basic shapes
 */
async function basicDrawingExample() {
  // Initialize CanvasKit
  const CanvasKit = await CanvasKitInit({
    wasmUrl: '/canvaskit.wasm'
  })
  
  // Get canvas element
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  
  // Create a surface
  const surface = CanvasKit.MakeCanvasSurface(canvas)
  if (!surface) {
    console.error('Could not create surface')
    return
  }
  
  // Create paint
  const paint = CanvasKit.MakePaint()
  paint.setColor(CanvasKit.RED)
  paint.setAntiAlias(true)
  
  // Draw
  const skCanvas = surface.getCanvas()
  skCanvas.clear(CanvasKit.WHITE)
  skCanvas.drawRect({ left: 10, top: 10, right: 110, bottom: 110 }, paint)
  surface.flush()
  
  // Clean up
  paint.delete()
  surface.delete()
}

/**
 * Example 2: Drawing with Paths
 * 
 * Demonstrates creating and drawing custom paths
 */
async function pathDrawingExample(CanvasKit: CanvasKitAPI, surface: Surface) {
  // Create a path
  const path = CanvasKit.MakePath()
  
  // Draw a star
  path.moveTo(50, 10)
  path.lineTo(65, 45)
  path.lineTo(100, 45)
  path.lineTo(70, 70)
  path.lineTo(85, 105)
  path.lineTo(50, 85)
  path.lineTo(15, 105)
  path.lineTo(30, 70)
  path.lineTo(0, 45)
  path.lineTo(35, 45)
  path.close()
  
  // Create paint for stroke
  const strokePaint = CanvasKit.MakePaint()
  strokePaint.setColor(CanvasKit.BLUE)
  strokePaint.setStyle(CanvasKit.PaintStyle.Stroke)
  strokePaint.setStrokeWidth(2)
  strokePaint.setAntiAlias(true)
  
  // Create paint for fill
  const fillPaint = CanvasKit.MakePaint()
  fillPaint.setColor(CanvasKit.Color(255, 255, 0, 0.5)) // Yellow with 50% opacity
  fillPaint.setStyle(CanvasKit.PaintStyle.Fill)
  fillPaint.setAntiAlias(true)
  
  // Draw the path
  const skCanvas = surface.getCanvas()
  skCanvas.clear(CanvasKit.WHITE)
  skCanvas.drawPath(path, fillPaint)
  skCanvas.drawPath(path, strokePaint)
  surface.flush()
  
  // Clean up
  path.delete()
  strokePaint.delete()
  fillPaint.delete()
}

/**
 * Example 3: Canvas Transformations
 * 
 * Shows how to use save/restore and transformations
 */
async function transformationExample(CanvasKit: CanvasKitAPI, surface: Surface) {
  const skCanvas = surface.getCanvas()
  const paint = CanvasKit.MakePaint()
  paint.setColor(CanvasKit.RED)
  paint.setAntiAlias(true)
  
  skCanvas.clear(CanvasKit.WHITE)
  
  // Draw original
  skCanvas.drawCircle(50, 50, 20, paint)
  
  // Save state and transform
  skCanvas.save()
  skCanvas.translate(100, 0)
  skCanvas.scale(1.5, 1.5)
  paint.setColor(CanvasKit.BLUE)
  skCanvas.drawCircle(50, 50, 20, paint)
  skCanvas.restore()
  
  // Another transformation
  skCanvas.save()
  skCanvas.translate(200, 0)
  skCanvas.rotate(45)
  paint.setColor(CanvasKit.GREEN)
  skCanvas.drawRect({ left: 30, top: 30, right: 70, bottom: 70 }, paint)
  skCanvas.restore()
  
  surface.flush()
  paint.delete()
}

/**
 * Example 4: Animation Loop
 * 
 * Demonstrates continuous rendering with requestAnimationFrame
 */
async function animationExample(CanvasKit: CanvasKitAPI, canvas: HTMLCanvasElement) {
  const surface = CanvasKit.MakeCanvasSurface(canvas)
  if (!surface) {
    console.error('Could not create surface')
    return
  }
  
  const paint = CanvasKit.MakePaint()
  paint.setAntiAlias(true)
  
  let angle = 0
  
  function draw() {
    const skCanvas = surface.getCanvas()
    skCanvas.clear(CanvasKit.WHITE)
    
    // Draw rotating square
    skCanvas.save()
    skCanvas.translate(canvas.width / 2, canvas.height / 2)
    skCanvas.rotate(angle)
    
    paint.setColor(CanvasKit.Color(
      Math.floor(Math.sin(angle * 0.1) * 127 + 128),
      Math.floor(Math.cos(angle * 0.1) * 127 + 128),
      200
    ))
    
    skCanvas.drawRect({ left: -50, top: -50, right: 50, bottom: 50 }, paint)
    skCanvas.restore()
    
    surface.flush()
    
    angle += 2
    requestAnimationFrame(draw)
  }
  
  draw()
}

/**
 * Example 5: Complex Drawing with Multiple Shapes
 * 
 * Shows combining different drawing operations
 */
async function complexDrawingExample(CanvasKit: CanvasKitAPI, surface: Surface) {
  const skCanvas = surface.getCanvas()
  
  // Clear background
  skCanvas.clear(CanvasKit.ColorAsInt(240, 240, 240))
  
  // Create paints
  const fillPaint = CanvasKit.MakePaint()
  fillPaint.setAntiAlias(true)
  fillPaint.setStyle(CanvasKit.PaintStyle.Fill)
  
  const strokePaint = CanvasKit.MakePaint()
  strokePaint.setAntiAlias(true)
  strokePaint.setStyle(CanvasKit.PaintStyle.Stroke)
  strokePaint.setStrokeWidth(3)
  strokePaint.setColor(CanvasKit.BLACK)
  
  // Draw background circles
  for (let i = 0; i < 5; i++) {
    fillPaint.setColor(CanvasKit.Color(
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      0.3
    ))
    skCanvas.drawCircle(
      Math.random() * 400,
      Math.random() * 400,
      30 + Math.random() * 50,
      fillPaint
    )
  }
  
  // Draw a house using path
  const housePath = CanvasKit.MakePath()
  // House body
  housePath.moveTo(200, 250)
  housePath.lineTo(200, 350)
  housePath.lineTo(300, 350)
  housePath.lineTo(300, 250)
  housePath.close()
  
  // Roof
  housePath.moveTo(190, 250)
  housePath.lineTo(250, 200)
  housePath.lineTo(310, 250)
  housePath.close()
  
  fillPaint.setColor(CanvasKit.ColorAsInt(200, 100, 50))
  skCanvas.drawPath(housePath, fillPaint)
  skCanvas.drawPath(housePath, strokePaint)
  
  // Draw door
  fillPaint.setColor(CanvasKit.ColorAsInt(100, 50, 0))
  skCanvas.drawRect({ left: 230, top: 300, right: 270, bottom: 350 }, fillPaint)
  skCanvas.drawRect({ left: 230, top: 300, right: 270, bottom: 350 }, strokePaint)
  
  // Draw windows
  fillPaint.setColor(CanvasKit.ColorAsInt(135, 206, 235))
  skCanvas.drawRect({ left: 210, top: 270, right: 230, bottom: 290 }, fillPaint)
  skCanvas.drawRect({ left: 210, top: 270, right: 230, bottom: 290 }, strokePaint)
  skCanvas.drawRect({ left: 270, top: 270, right: 290, bottom: 290 }, fillPaint)
  skCanvas.drawRect({ left: 270, top: 270, right: 290, bottom: 290 }, strokePaint)
  
  surface.flush()
  
  // Clean up
  housePath.delete()
  fillPaint.delete()
  strokePaint.delete()
}

/**
 * Example 6: Software Rendering (Raster Surface)
 * 
 * Shows using software rendering instead of GPU
 */
async function softwareRenderingExample() {
  const CanvasKit = await CanvasKitInit({
    wasmUrl: '/canvaskit.wasm'
  })
  
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  
  // Use software surface instead of WebGL
  const surface = CanvasKit.MakeSWCanvasSurface(canvas)
  if (!surface) {
    console.error('Could not create software surface')
    return
  }
  
  const paint = CanvasKit.MakePaint()
  paint.setColor(CanvasKit.MAGENTA)
  paint.setAntiAlias(true)
  
  const skCanvas = surface.getCanvas()
  skCanvas.clear(CanvasKit.WHITE)
  skCanvas.drawCircle(100, 100, 50, paint)
  surface.flush()
  
  paint.delete()
  surface.delete()
}

/**
 * Example 7: Proper Resource Management
 * 
 * Demonstrates best practices for managing CanvasKit resources
 */
class CanvasKitApp {
  private CanvasKit: CanvasKitAPI
  private surface: Surface
  private paints: Paint[] = []
  private paths: Path[] = []
  
  constructor(CanvasKit: CanvasKitAPI, surface: Surface) {
    this.CanvasKit = CanvasKit
    this.surface = surface
  }
  
  createPaint(): Paint {
    const paint = this.CanvasKit.MakePaint()
    this.paints.push(paint)
    return paint
  }
  
  createPath(): Path {
    const path = this.CanvasKit.MakePath()
    this.paths.push(path)
    return path
  }
  
  draw() {
    const skCanvas = this.surface.getCanvas()
    const paint = this.createPaint()
    
    paint.setColor(this.CanvasKit.RED)
    skCanvas.clear(this.CanvasKit.WHITE)
    skCanvas.drawCircle(100, 100, 50, paint)
    
    this.surface.flush()
  }
  
  // Clean up all resources
  destroy() {
    this.paints.forEach(paint => paint.delete())
    this.paths.forEach(path => path.delete())
    this.surface.delete()
    this.paints = []
    this.paths = []
  }
}

// Export examples for use
export {
  basicDrawingExample,
  pathDrawingExample,
  transformationExample,
  animationExample,
  complexDrawingExample,
  softwareRenderingExample,
  CanvasKitApp
}
