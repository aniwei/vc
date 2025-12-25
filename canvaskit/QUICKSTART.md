# CanvasKit Quick Start Guide

Get started with CanvasKit and cheap WebAssembly runtime in 5 minutes.

## Step 1: Install cheap

```bash
npm install @libmedia/cheap
```

## Step 2: Build or Download CanvasKit WASM

### Option A: Use Pre-built WASM (Recommended)

Download a pre-built CanvasKit WASM file compiled for cheap runtime:

```bash
# Download from releases or build server
# Place in your public directory
cp canvaskit.wasm ./public/
```

### Option B: Build from Source

Follow the detailed instructions in [BUILD.md](./BUILD.md) to compile CanvasKit yourself.

## Step 3: Set Up Your HTML

Create an HTML file with a canvas element:

```html
<!DOCTYPE html>
<html>
<head>
  <title>CanvasKit with cheap</title>
</head>
<body>
  <canvas id="myCanvas" width="400" height="400"></canvas>
  <script type="module" src="./main.js"></script>
</body>
</html>
```

## Step 4: Write Your First Drawing Code

Create `main.js`:

```javascript
import { CanvasKitInit } from '@aniwei/cheap/canvaskit'

async function main() {
  // Initialize CanvasKit
  const CanvasKit = await CanvasKitInit({
    wasmUrl: '/canvaskit.wasm'
  })
  
  // Get canvas
  const canvas = document.getElementById('myCanvas')
  
  // Create surface
  const surface = CanvasKit.MakeCanvasSurface(canvas)
  
  // Create paint
  const paint = CanvasKit.MakePaint()
  paint.setColor(CanvasKit.RED)
  paint.setAntiAlias(true)
  
  // Draw
  const skCanvas = surface.getCanvas()
  skCanvas.clear(CanvasKit.WHITE)
  skCanvas.drawCircle(200, 200, 100, paint)
  surface.flush()
  
  // Clean up
  paint.delete()
  // Keep surface alive for future drawing
}

main().catch(console.error)
```

## Step 5: Configure Your Build Tool

### For Vite

In `vite.config.js`:

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  // Vite configuration
  optimizeDeps: {
    exclude: ['@libmedia/cheap']
  }
})
```

### For Webpack

In `webpack.config.js`:

```javascript
module.exports = {
  // ... other config
  resolve: {
    alias: {
      '@aniwei/cheap': '@libmedia/cheap'
    }
  }
}
```

## Step 6: Run Your Application

```bash
# For Vite
npm run dev

# For other tools
npm start
```

Open your browser and you should see a red circle!

## Common Patterns

### Animation

```javascript
let angle = 0

function draw() {
  const skCanvas = surface.getCanvas()
  skCanvas.clear(CanvasKit.WHITE)
  
  skCanvas.save()
  skCanvas.translate(200, 200)
  skCanvas.rotate(angle)
  
  paint.setColor(CanvasKit.BLUE)
  skCanvas.drawRect({ left: -50, top: -50, right: 50, bottom: 50 }, paint)
  
  skCanvas.restore()
  surface.flush()
  
  angle += 1
  requestAnimationFrame(draw)
}

draw()
```

### Drawing Paths

```javascript
const path = CanvasKit.MakePath()
path.moveTo(50, 50)
path.lineTo(150, 50)
path.lineTo(150, 150)
path.lineTo(50, 150)
path.close()

const paint = CanvasKit.MakePaint()
paint.setColor(CanvasKit.GREEN)
paint.setStyle(CanvasKit.PaintStyle.Stroke)
paint.setStrokeWidth(3)

skCanvas.drawPath(path, paint)
surface.flush()

path.delete()
paint.delete()
```

### Custom Colors

```javascript
// RGB with alpha (0.0 - 1.0)
const transparentRed = CanvasKit.Color(255, 0, 0, 0.5)
paint.setColor(transparentRed)

// RGB with integer alpha (0 - 255)
const semiBlue = CanvasKit.ColorAsInt(0, 0, 255, 128)
paint.setColor(semiBlue)
```

## Troubleshooting

### WASM Loading Error

**Problem**: `Failed to compile WebAssembly module`

**Solution**: Ensure the WASM file path is correct and accessible:
```javascript
const CanvasKit = await CanvasKitInit({
  wasmUrl: '/canvaskit.wasm'  // Check this path
})
```

### Memory Errors

**Problem**: Objects not being cleaned up properly

**Solution**: Always call `.delete()` on objects you create:
```javascript
const paint = CanvasKit.MakePaint()
// ... use paint ...
paint.delete()  // Important!
```

### Nothing Renders

**Problem**: Drawing code runs but nothing appears

**Solution**: Make sure to call `surface.flush()` after drawing:
```javascript
skCanvas.drawCircle(100, 100, 50, paint)
surface.flush()  // This makes it visible!
```

### WebGL Context Error

**Problem**: `Unable to initialize WebGL context`

**Solution**: Use software rendering:
```javascript
const surface = CanvasKit.MakeSWCanvasSurface(canvas)
```

## Next Steps

- Read the full [README.md](./README.md) for API documentation
- Check out [examples.ts](./examples.ts) for more code examples
- Learn about [building CanvasKit](./BUILD.md) from source
- Explore the cheap runtime features in the main [cheap README](../README.md)

## Performance Tips

1. **Reuse Objects**: Create paints and paths once, reuse them
2. **Batch Operations**: Group multiple draw calls before flush
3. **Use GPU Rendering**: Prefer `MakeCanvasSurface` over `MakeSWCanvasSurface`
4. **Clean Up**: Delete objects you no longer need to free memory

## Resources

- [Skia Documentation](https://skia.org/docs/)
- [CanvasKit API Reference](https://skia.org/docs/user/modules/canvaskit/)
- [cheap Runtime Documentation](../README.md)

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the examples in `examples.ts`
3. Look at existing issues in the repository
4. Create a new issue with a minimal reproduction

Happy drawing! 🎨
