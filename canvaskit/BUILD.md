# Building CanvasKit for cheap WebAssembly Runtime

This document describes how to compile Skia CanvasKit to work with the `@aniwei/cheap` WebAssembly runtime.

## Prerequisites

1. Clone the Skia repository with CanvasKit:
```bash
# Clone the official Skia repository or the aniwei fork
# Official: https://github.com/google/skia.git
# Fork with potential custom changes: https://github.com/aniwei/skia.git
git clone https://github.com/aniwei/skia.git
cd skia
```

Note: This build script is designed for the aniwei/skia fork which may include
custom modifications for cheap integration. If using the official Google Skia
repository, you may need to adjust the build configuration.

2. Install Emscripten SDK (version should match the one used by Skia)
```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

## Compilation Script

Create a build script `build_canvaskit_cheap.sh` in the `modules/canvaskit` directory:

```bash
#!/bin/bash

# CanvasKit build script for cheap WebAssembly runtime
# This compiles CanvasKit as a dynamic module compatible with cheap's
# memory management and runtime system

set -e

# Output directory
OUT_DIR="./out/cheap"
mkdir -p $OUT_DIR

# Compile CanvasKit to WebAssembly
emcc \
  -O3 \
  -std=c++17 \
  \
  # Source files (adjust paths as needed)
  src/canvaskit_bindings.cpp \
  \
  # Include Skia headers
  -I../../include/core \
  -I../../include/effects \
  -I../../include/gpu \
  -I../../include/pathops \
  -I../../include/utils \
  \
  # Link Skia library
  -L../../out/wasm/Release \
  -lskia \
  \
  # WebAssembly options
  -s WASM=1 \
  \
  # Disable filesystem
  -s FILESYSTEM=0 \
  \
  # Disable fetch
  -s FETCH=0 \
  \
  # Disable assertions in release
  -s ASSERTIONS=0 \
  \
  # Use imported memory from cheap
  -s IMPORTED_MEMORY=1 \
  \
  # Initial memory size (16MB)
  -s INITIAL_MEMORY=16777216 \
  \
  # Allow memory growth
  -s ALLOW_MEMORY_GROWTH=1 \
  \
  # Don't use pthreads (cheap handles threading)
  -s USE_PTHREADS=0 \
  \
  # Dynamic linking - main module
  -s MAIN_MODULE=2 \
  \
  # Not a side module
  -s SIDE_MODULE=0 \
  \
  # Use cheap's malloc instead of built-in
  -s MALLOC="none" \
  \
  # Allow undefined symbols (will be provided by cheap runtime)
  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
  \
  # Export all functions
  -s EXPORTED_FUNCTIONS='["_malloc","_free","_MakePaint","_DeletePaint","_Paint_setColor","_Paint_setAntiAlias","_Paint_setStyle","_Paint_setStrokeWidth","_MakePath","_DeletePath","_Path_moveTo","_Path_lineTo","_Path_close","_Path_reset","_MakeCanvasSurface","_MakeSWCanvasSurface","_DeleteSurface","_Surface_getCanvas","_Surface_flush","_Canvas_clear","_Canvas_drawRect","_Canvas_drawPath","_Canvas_drawCircle","_Canvas_save","_Canvas_restore","_Canvas_translate","_Canvas_scale","_Canvas_rotate"]' \
  \
  # Export runtime methods
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  \
  # Disable embind (we use pure C exports)
  -s EMBIND=0 \
  \
  # Output file
  -o $OUT_DIR/canvaskit.wasm

echo "Build complete! Output: $OUT_DIR/canvaskit.wasm"
```

## C++ Bindings Layer

Replace embind bindings with pure C exports. Create `src/canvaskit_bindings.cpp`:

```cpp
#include "include/core/SkCanvas.h"
#include "include/core/SkPaint.h"
#include "include/core/SkPath.h"
#include "include/core/SkSurface.h"
#include "include/gpu/GrDirectContext.h"
#include "include/gpu/gl/GrGLInterface.h"

extern "C" {

// Paint functions
void* MakePaint() {
    return new SkPaint();
}

void DeletePaint(void* paint) {
    delete static_cast<SkPaint*>(paint);
}

void Paint_setColor(void* paint, uint32_t color) {
    static_cast<SkPaint*>(paint)->setColor(color);
}

void Paint_setAntiAlias(void* paint, bool aa) {
    static_cast<SkPaint*>(paint)->setAntiAlias(aa);
}

void Paint_setStyle(void* paint, int style) {
    static_cast<SkPaint*>(paint)->setStyle(static_cast<SkPaint::Style>(style));
}

void Paint_setStrokeWidth(void* paint, float width) {
    static_cast<SkPaint*>(paint)->setStrokeWidth(width);
}

// Path functions
void* MakePath() {
    return new SkPath();
}

void DeletePath(void* path) {
    delete static_cast<SkPath*>(path);
}

void Path_moveTo(void* path, float x, float y) {
    static_cast<SkPath*>(path)->moveTo(x, y);
}

void Path_lineTo(void* path, float x, float y) {
    static_cast<SkPath*>(path)->lineTo(x, y);
}

void Path_close(void* path) {
    static_cast<SkPath*>(path)->close();
}

void Path_reset(void* path) {
    static_cast<SkPath*>(path)->reset();
}

// Surface functions
void* MakeCanvasSurface(int width, int height) {
    // Create GL surface
    auto interface = GrGLMakeNativeInterface();
    if (!interface) {
        return nullptr;
    }
    
    auto context = GrDirectContext::MakeGL(interface);
    if (!context) {
        return nullptr;
    }
    
    SkImageInfo info = SkImageInfo::MakeN32Premul(width, height);
    auto surface = SkSurface::MakeRenderTarget(
        context.get(),
        SkBudgeted::kNo,
        info
    );
    
    return surface ? surface.release() : nullptr;
}

void* MakeSWCanvasSurface(int width, int height) {
    // Create raster surface (software rendering)
    SkImageInfo info = SkImageInfo::MakeN32Premul(width, height);
    auto surface = SkSurface::MakeRaster(info);
    return surface ? surface.release() : nullptr;
}

void DeleteSurface(void* surface) {
    delete static_cast<SkSurface*>(surface);
}

void* Surface_getCanvas(void* surface) {
    return static_cast<SkSurface*>(surface)->getCanvas();
}

void Surface_flush(void* surface) {
    static_cast<SkSurface*>(surface)->flush();
}

// Canvas functions
void Canvas_clear(void* canvas, uint32_t color) {
    static_cast<SkCanvas*>(canvas)->clear(color);
}

void Canvas_drawRect(void* canvas, float left, float top, float right, float bottom, void* paint) {
    SkRect rect = SkRect::MakeLTRB(left, top, right, bottom);
    static_cast<SkCanvas*>(canvas)->drawRect(rect, *static_cast<SkPaint*>(paint));
}

void Canvas_drawPath(void* canvas, void* path, void* paint) {
    static_cast<SkCanvas*>(canvas)->drawPath(
        *static_cast<SkPath*>(path),
        *static_cast<SkPaint*>(paint)
    );
}

void Canvas_drawCircle(void* canvas, float cx, float cy, float radius, void* paint) {
    static_cast<SkCanvas*>(canvas)->drawCircle(cx, cy, radius, *static_cast<SkPaint*>(paint));
}

int Canvas_save(void* canvas) {
    return static_cast<SkCanvas*>(canvas)->save();
}

void Canvas_restore(void* canvas) {
    static_cast<SkCanvas*>(canvas)->restore();
}

void Canvas_translate(void* canvas, float dx, float dy) {
    static_cast<SkCanvas*>(canvas)->translate(dx, dy);
}

void Canvas_scale(void* canvas, float sx, float sy) {
    static_cast<SkCanvas*>(canvas)->scale(sx, sy);
}

void Canvas_rotate(void* canvas, float degrees) {
    static_cast<SkCanvas*>(canvas)->rotate(degrees);
}

} // extern "C"
```

## Building

1. Make the script executable:
```bash
chmod +x build_canvaskit_cheap.sh
```

2. Run the build script:
```bash
./build_canvaskit_cheap.sh
```

3. The compiled `canvaskit.wasm` will be in `out/cheap/canvaskit.wasm`

## Integration with cheap

After building, copy the WASM file to your project:

```bash
cp modules/canvaskit/out/cheap/canvaskit.wasm /path/to/your/project/public/
```

Then use it with the cheap integration:

```typescript
import { CanvasKitInit } from '@aniwei/cheap/canvaskit'

const CanvasKit = await CanvasKitInit({
  wasmUrl: '/canvaskit.wasm'
})
```

## Memory Management

The compiled module uses cheap's memory allocator:
- All `malloc`, `free`, `calloc`, `realloc`, and `aligned_alloc` calls are handled by cheap
- Memory is shared across threads when using cheap's threading system
- No need for emscripten's built-in memory management

## Thread Support

If you need threading:
1. Build Skia with thread support
2. Use cheap's pthread adaptation layer
3. Ensure shared memory is enabled in your environment

## Troubleshooting

### Undefined symbol errors
If you get undefined symbol errors, make sure:
- `ERROR_ON_UNDEFINED_SYMBOLS=0` is set
- All required symbols are exported from cheap's runtime

### Memory errors
If you get memory allocation errors:
- Increase `INITIAL_MEMORY` value
- Ensure `ALLOW_MEMORY_GROWTH=1` is set
- Check that cheap's allocator is properly initialized

### WebGL errors
If WebGL rendering doesn't work:
- Verify WebGL context is created before calling CanvasKit functions
- Check browser console for WebGL errors
- Ensure WebGL imports are properly configured in CanvasKitRunner
