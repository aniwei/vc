#pragma once

// Minimal C ABI for using a Skia/CanvasKit subset from cheap (no JS glue).
//
// Notes:
// - All pointers are raw pointers in the Wasm address space (i32).
// - Memory allocation is expected to be provided by cheap via env.__libc_malloc/__libc_free.
// - The corresponding Wasm build should export these symbols via -sEXPORTED_FUNCTIONS.

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Paint
void* MakePaint();
void DeletePaint(void* paint);
void Paint_setColor(void* paint, uint32_t color);
void Paint_setAntiAlias(void* paint, int aa);
void Paint_setStyle(void* paint, int style);
void Paint_setStrokeWidth(void* paint, float width);
void Paint_setStrokeCap(void* paint, int cap);
void Paint_setStrokeJoin(void* paint, int join);
void Paint_setAlphaf(void* paint, float a);
void Paint_setBlendMode(void* paint, int mode);
void Paint_setShader(void* paint, void* shader);
void Paint_setColorFilter(void* paint, void* colorFilter);

// Path (builder-backed)
void* MakePath();
void DeletePath(void* path);
void Path_moveTo(void* path, float x, float y);
void Path_lineTo(void* path, float x, float y);
void Path_quadTo(void* path, float x1, float y1, float x2, float y2);
void Path_cubicTo(void* path, float x1, float y1, float x2, float y2, float x3, float y3);
void Path_addRect(void* path, float left, float top, float right, float bottom);
void Path_addCircle(void* path, float cx, float cy, float r);
void Path_close(void* path);
void Path_reset(void* path);

// Path (snapshot)
void* Path_snapshot(void* path);
void DeleteSkPath(void* skPath);
void Path_transform(void* skPath, const float* m9);

// Surface
void* MakeCanvasSurface(int width, int height);
void* MakeSWCanvasSurface(int width, int height);
void DeleteSurface(void* surface);
void* Surface_getCanvas(void* surface);
void Surface_flush(void* surface);
int Surface_width(void* surface);
int Surface_height(void* surface);
void* Surface_makeImageSnapshot(void* surface);
void* Surface_encodeToPNG(void* surface);
int Surface_readPixelsRGBA8888(void* surface,
                              int x,
                              int y,
                              int width,
                              int height,
                              void* dst,
                              int dstRowBytes);

// Canvas
void Canvas_clear(void* canvas, uint32_t color);
void Canvas_drawRect(void* canvas, float left, float top, float right, float bottom, void* paint);
void Canvas_drawPath(void* canvas, void* path, void* paint);
void Canvas_drawSkPath(void* canvas, void* skPath, void* paint);
void Canvas_drawCircle(void* canvas, float cx, float cy, float radius, void* paint);
void Canvas_drawLine(void* canvas, float x0, float y0, float x1, float y1, void* paint);
void Canvas_drawImage(void* canvas, void* image, float x, float y, int filterMode, int mipmapMode);
void Canvas_drawImageRect(void* canvas,
                          void* image,
                          float srcLeft,
                          float srcTop,
                          float srcRight,
                          float srcBottom,
                          float dstLeft,
                          float dstTop,
                          float dstRight,
                          float dstBottom,
                          int filterMode,
                          int mipmapMode);
void Canvas_drawTextBlob(void* canvas, void* blob, float x, float y, void* paint);
int Canvas_save(void* canvas);
void Canvas_restore(void* canvas);
void Canvas_translate(void* canvas, float dx, float dy);
void Canvas_scale(void* canvas, float sx, float sy);
void Canvas_rotate(void* canvas, float degrees);
void Canvas_concat(void* canvas, const float* m9);
void Canvas_setMatrix(void* canvas, const float* m9);
void Canvas_clipRect(void* canvas,
                     float left,
                     float top,
                     float right,
                     float bottom,
                     int clipOp,
                     int doAA);

// Image / Data
void DeleteImage(void* image);
int Image_width(void* image);
int Image_height(void* image);
void* Image_encodeToPNG(void* image);
void* MakeImageFromEncoded(const void* bytes, int size);

void DeleteData(void* data);
const void* Data_bytes(void* data);
int Data_size(void* data);

// Shader
void DeleteShader(void* shader);
void* MakeColorShader(uint32_t color);
void* MakeLinearGradientShader(float x0,
                              float y0,
                              float x1,
                              float y1,
                              const uint32_t* colors,
                              const float* positions,
                              int count,
                              int tileMode);

// ColorFilter
void DeleteColorFilter(void* colorFilter);
void* MakeBlendColorFilter(uint32_t color, int blendMode);

// Font
void* MakeFont();
void DeleteFont(void* font);
void Font_setSize(void* font, float size);
void Font_setEdging(void* font, int edging);

// Typeface
void* MakeTypefaceFromData(const void* bytes, int size, int ttcIndex);
void DeleteTypeface(void* typeface);
void Font_setTypeface(void* font, void* typeface);

// TextBlob
void DeleteTextBlob(void* blob);
void* MakeTextBlobFromText(const void* bytes, int byteLength, void* font, int encoding);

// Paragraph (SkParagraph)
// Returns an owned paragraph handle (not a raw skia::textlayout::Paragraph*).
// Call DeleteParagraph() when done.
void* MakeParagraphFromText(const char* utf8,
                            int byteLength,
                            const void* fontBytes,
                            int fontByteLength,
                            float fontSize,
                            float wrapWidth,
                            uint32_t color,
                            int textAlign,
                            int maxLines);
void Paragraph_layout(void* paragraph, float width);
void DeleteParagraph(void* paragraph);
void Canvas_drawParagraph(void* canvas, void* paragraph, float x, float y);

#ifdef __cplusplus
}  // extern "C"
#endif
