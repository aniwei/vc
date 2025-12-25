# CanvasKit Integration for cheap WebAssembly Runtime

This module provides integration between Skia CanvasKit and the `@aniwei/cheap` WebAssembly runtime.

## Features

- **Memory Management**: Uses cheap's allocator for all memory operations
- **Thread Safety**: Compatible with cheap's threading system
- **Type Safety**: Full TypeScript type definitions
- **WebGL Support**: Automatic WebGL context management
- **API Compatibility**: Maintains compatibility with CanvasKit API patterns

## Installation

```bash
npm install @libmedia/cheap
```

## Usage

### Basic Example

```typescript
import { CanvasKitInit } from '@aniwei/cheap/canvaskit'

// Initialize CanvasKit
const CanvasKit = await CanvasKitInit({
  wasmUrl: '/canvaskit.wasm'
})

// Get canvas element
const canvas = document.getElementById('canvas') as HTMLCanvasElement

// Create a surface
const surface = CanvasKit.MakeCanvasSurface(canvas)
if (!surface) {
  throw new Error('Could not create surface')
}

// Create drawing objects
const paint = CanvasKit.MakePaint()
paint.setColor(CanvasKit.RED)
paint.setAntiAlias(true)

// Get the canvas and draw
const skCanvas = surface.getCanvas()
skCanvas.clear(CanvasKit.WHITE)
skCanvas.drawRect({ left: 10, top: 10, right: 110, bottom: 110 }, paint)

// Flush to screen
surface.flush()

// Clean up
paint.delete()
surface.delete()
```

### Drawing a Path

```typescript
const path = CanvasKit.MakePath()
path.moveTo(10, 10)
path.lineTo(100, 10)
path.lineTo(100, 100)
path.lineTo(10, 100)
path.close()

const paint = CanvasKit.MakePaint()
paint.setColor(CanvasKit.BLUE)
paint.setStyle(CanvasKit.PaintStyle.Stroke)
paint.setStrokeWidth(2)

const canvas = surface.getCanvas()
canvas.drawPath(path, paint)
surface.flush()

path.delete()
paint.delete()
```

### Using Colors

```typescript
// Predefined colors
paint.setColor(CanvasKit.RED)
paint.setColor(CanvasKit.GREEN)
paint.setColor(CanvasKit.BLUE)

// Custom colors using Color function (RGBA with alpha 0.0-1.0)
const transparentRed = CanvasKit.Color(255, 0, 0, 0.5)
paint.setColor(transparentRed)

// Custom colors using ColorAsInt (RGBA with alpha 0-255)
const semiTransparentBlue = CanvasKit.ColorAsInt(0, 0, 255, 128)
paint.setColor(semiTransparentBlue)
```

### Canvas Transformations

```typescript
const canvas = surface.getCanvas()

canvas.save()
canvas.translate(50, 50)
canvas.rotate(45)
canvas.scale(2, 2)

// Draw something transformed
canvas.drawCircle(0, 0, 20, paint)

canvas.restore() // Restore to previous state
```

### Animation Loop

```typescript
function draw() {
  const canvas = surface.getCanvas()
  canvas.clear(CanvasKit.WHITE)
  
  // Draw frame
  const paint = CanvasKit.MakePaint()
  paint.setColor(CanvasKit.Color(255, 0, 0, 0.8))
  canvas.drawCircle(100, 100, 50, paint)
  
  surface.flush()
  paint.delete()
  
  requestAnimationFrame(draw)
}

draw()
```

## API Reference

### CanvasKitInit(options?)

Initializes CanvasKit with cheap runtime.

**Options:**
- `wasmUrl?: string` - URL to the canvaskit.wasm file
- `wasmBinary?: Uint8Array` - Pre-loaded WASM binary

**Returns:** `Promise<CanvasKitAPI>`

### CanvasKitAPI

#### Factory Functions

- `MakePaint(): Paint` - Create a new Paint object
- `MakePath(): Path` - Create a new Path object
- `MakeCanvasSurface(canvas: HTMLCanvasElement): Surface | null` - Create GPU-accelerated surface
- `MakeSWCanvasSurface(canvas: HTMLCanvasElement): Surface | null` - Create software-rendered surface

#### Constants

- `RED`, `GREEN`, `BLUE`, `YELLOW`, `CYAN`, `MAGENTA`, `WHITE`, `BLACK`, `TRANSPARENT` - Predefined colors

#### Utility Functions

- `Color(r: number, g: number, b: number, a?: number): ColorInt` - Create RGBA color
- `ColorAsInt(r: number, g: number, b: number, a?: number): ColorInt` - Create RGBA color with integer alpha

### Paint

- `setColor(color: ColorInt): void` - Set paint color
- `setAntiAlias(aa: boolean): void` - Enable/disable anti-aliasing
- `setStyle(style: PaintStyle): void` - Set fill or stroke style
- `setStrokeWidth(width: number): void` - Set stroke width
- `delete(): void` - Free paint resources

### Path

- `moveTo(x: number, y: number): void` - Move to point
- `lineTo(x: number, y: number): void` - Draw line to point
- `close(): void` - Close the path
- `reset(): void` - Reset the path
- `delete(): void` - Free path resources

### Canvas

- `clear(color: ColorInt): void` - Clear canvas with color
- `drawRect(rect: Rect, paint: Paint): void` - Draw rectangle
- `drawPath(path: Path, paint: Paint): void` - Draw path
- `drawCircle(cx: number, cy: number, radius: number, paint: Paint): void` - Draw circle
- `save(): number` - Save canvas state
- `restore(): void` - Restore canvas state
- `translate(dx: number, dy: number): void` - Translate canvas
- `scale(sx: number, sy: number): void` - Scale canvas
- `rotate(degrees: number): void` - Rotate canvas

### Surface

- `getCanvas(): Canvas` - Get the canvas for drawing
- `flush(): void` - Flush pending operations to screen
- `delete(): void` - Free surface resources

## Building CanvasKit

See [BUILD.md](./BUILD.md) for instructions on compiling CanvasKit for cheap runtime.

## Memory Management

All CanvasKit objects must be explicitly deleted when no longer needed:

```typescript
const paint = CanvasKit.MakePaint()
// ... use paint ...
paint.delete() // Important: free memory
```

Failing to delete objects will result in memory leaks.

## Architecture

The integration consists of:

1. **CanvasKitRunner** - Extends WebAssemblyRunner with CanvasKit-specific setup
2. **WebGL Imports** - JavaScript implementations of WebGL functions required by CanvasKit
3. **Bindings** - JavaScript wrappers for C API functions
4. **Type Definitions** - TypeScript types for the entire API

## Performance

- Uses cheap's high-performance memory allocator
- Direct function calls via WebAssembly
- Minimal JavaScript/WASM boundary crossings
- GPU-accelerated rendering (when using MakeCanvasSurface)

## Browser Compatibility

- Chrome/Edge: 84+
- Firefox: 79+
- Safari: 14.1+
- Safari iOS: 14.5+

WebGL support required for GPU-accelerated surfaces.

## License

MIT
