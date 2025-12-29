#include "include/core/SkBlendMode.h"
#include "include/core/SkCanvas.h"
#include "include/core/SkColor.h"
#include "include/core/SkColorFilter.h"
#include "include/codec/SkCodec.h"
#include "include/core/SkData.h"
#include "include/core/SkFont.h"
#include "include/core/SkFontMgr.h"
#include "include/core/SkImage.h"
#include "include/core/SkImageInfo.h"
#include "include/core/SkMatrix.h"
#include "include/core/SkPaint.h"
#include "include/core/SkPath.h"
#include "include/core/SkPathBuilder.h"
#include "include/core/SkRect.h"
#include "include/core/SkRRect.h"
#include "include/core/SkSamplingOptions.h"
#include "include/core/SkShader.h"
#include "include/core/SkStream.h"
#include "include/core/SkSurface.h"
#include "include/core/SkTextBlob.h"
#include "include/core/SkTypeface.h"
#include "include/core/SkTypes.h"
#include "include/effects/SkGradientShader.h"
#include "include/encode/SkPngEncoder.h"
#include "include/gpu/GpuTypes.h"
#include "include/gpu/ganesh/GrDirectContext.h"
#include "include/gpu/ganesh/SkSurfaceGanesh.h"
#include "include/gpu/ganesh/gl/GrGLDirectContext.h"
#include "include/gpu/ganesh/gl/GrGLInterface.h"
#include "include/ports/SkFontMgr_data.h"

#include "modules/skparagraph/include/FontCollection.h"
#include "modules/skparagraph/include/Paragraph.h"
#include "modules/skparagraph/include/ParagraphBuilder.h"
#include "modules/skparagraph/include/ParagraphStyle.h"
#include "modules/skparagraph/include/TextStyle.h"
#include "modules/skunicode/include/SkUnicode.h"

#if defined(SK_UNICODE_ICU_IMPLEMENTATION)
#include "modules/skunicode/include/SkUnicode_icu.h"
#endif

#include <cstddef>
#include <cstring>
#include <array>
#include <memory>
#include <optional>
#include <vector>

extern "C" {

// Enums (exported as ints)
int SkPathFillType_Winding() {
  return static_cast<int>(SkPathFillType::kWinding);
}

int SkPathFillType_EvenOdd() {
  return static_cast<int>(SkPathFillType::kEvenOdd);
}

int SkPathFillType_InverseWinding() {
  return static_cast<int>(SkPathFillType::kInverseWinding);
}

int SkPathFillType_InverseEvenOdd() {
  return static_cast<int>(SkPathFillType::kInverseEvenOdd);
}

int SkPaintStyle_Fill() {
  return static_cast<int>(SkPaint::Style::kFill_Style);
}

int SkPaintStyle_Stroke() {
  return static_cast<int>(SkPaint::Style::kStroke_Style);
}

int SkPaintStyle_StrokeAndFill() {
  return static_cast<int>(SkPaint::Style::kStrokeAndFill_Style);
}

int SkFilterMode_Nearest() {
  return static_cast<int>(SkFilterMode::kNearest);
}

int SkFilterMode_Linear() {
  return static_cast<int>(SkFilterMode::kLinear);
}

int SkMipmapMode_None() {
  return static_cast<int>(SkMipmapMode::kNone);
}

int SkMipmapMode_Nearest() {
  return static_cast<int>(SkMipmapMode::kNearest);
}

int SkMipmapMode_Linear() {
  return static_cast<int>(SkMipmapMode::kLinear);
}

int SkTileMode_Clamp() {
  return static_cast<int>(SkTileMode::kClamp);
}

int SkTileMode_Repeat() {
  return static_cast<int>(SkTileMode::kRepeat);
}

int SkTileMode_Mirror() {
  return static_cast<int>(SkTileMode::kMirror);
}

int SkTileMode_Decal() {
  return static_cast<int>(SkTileMode::kDecal);
}

int SkClipOp_Difference() {
  return static_cast<int>(SkClipOp::kDifference);
}

int SkClipOp_Intersect() {
  return static_cast<int>(SkClipOp::kIntersect);
}

int SkTextDirection_LTR() {
  return static_cast<int>(skia::textlayout::TextDirection::kLtr);
}

int SkTextDirection_RTL() {
  return static_cast<int>(skia::textlayout::TextDirection::kRtl);
}

int SkTextAlign_Left() {
  return static_cast<int>(skia::textlayout::TextAlign::kLeft);
}

int SkTextAlign_Right() {
  return static_cast<int>(skia::textlayout::TextAlign::kRight);
}

int SkTextAlign_Center() {
  return static_cast<int>(skia::textlayout::TextAlign::kCenter);
}

int SkTextAlign_Justify() {
  return static_cast<int>(skia::textlayout::TextAlign::kJustify);
}

int SkTextAlign_Start() {
  return static_cast<int>(skia::textlayout::TextAlign::kStart);
}

int SkTextAlign_End() {
  return static_cast<int>(skia::textlayout::TextAlign::kEnd);
}

// Provided by cheap runtime via WebAssemblyRunner imports.
void* __libc_malloc(size_t size);
void __libc_free(void* ptr);

// Emscripten/GL shims may reference malloc/free even when using -sMALLOC=none.
// We forward them to cheap's allocator.
void* malloc(size_t size) { return __libc_malloc(size); }
void free(void* ptr) { __libc_free(ptr); }

}  // extern "C"

namespace {

namespace para = skia::textlayout;

struct CheapParagraph {
  std::unique_ptr<para::Paragraph> paragraph;
  sk_sp<para::FontCollection> fontCollection;
  sk_sp<SkUnicode> unicode;
  std::vector<sk_sp<SkData>> fontDatas;
};

struct CheapParagraphBuilder {
  std::unique_ptr<para::ParagraphBuilder> builder;
  sk_sp<para::FontCollection> fontCollection;
  sk_sp<SkUnicode> unicode;
  std::vector<sk_sp<SkData>> fontDatas;
  SkString family;
};

sk_sp<SkUnicode> MakeUnicode() {
#if defined(SK_UNICODE_ICU_IMPLEMENTATION)
  return SkUnicodes::ICU::Make();
#else
  return nullptr;
#endif
}

sk_sp<const GrGLInterface> gInterface;
sk_sp<GrDirectContext> gContext;

bool EnsureGLContext() {
  if (gContext && gInterface) {
    return true;
  }

  gInterface = GrGLMakeNativeInterface();
  if (!gInterface) {
    return false;
  }

  gContext = GrDirectContexts::MakeGL(gInterface);
  return (bool)gContext;
}

SkSurface* MakeRenderTargetSurface(int width, int height) {
  if (!EnsureGLContext()) {
    return nullptr;
  }

  const SkImageInfo info = SkImageInfo::MakeN32Premul(width, height);
  sk_sp<SkSurface> surface = SkSurfaces::RenderTarget(gContext.get(), skgpu::Budgeted::kNo, info);
  if (!surface) {
    return nullptr;
  }

  SkSafeRef(surface.get());
  return surface.get();
}

SkSurface* MakeRasterSurface(int width, int height) {
  const SkImageInfo info = SkImageInfo::MakeN32Premul(width, height);
  sk_sp<SkSurface> surface = SkSurfaces::Raster(info);
  if (!surface) {
    return nullptr;
  }

  SkSafeRef(surface.get());
  return surface.get();
}

SkFilterMode ToFilterMode(int filterMode) {
  // 0: nearest, 1: linear
  return filterMode == 1 ? SkFilterMode::kLinear : SkFilterMode::kNearest;
}

SkMipmapMode ToMipmapMode(int mipmapMode) {
  // 0: none, 1: nearest, 2: linear
  switch (mipmapMode) {
    case 2:
      return SkMipmapMode::kLinear;
    case 1:
      return SkMipmapMode::kNearest;
    default:
      return SkMipmapMode::kNone;
  }
}

SkTextEncoding ToTextEncoding(int encoding) {
  // 0: UTF8, 1: UTF16, 2: UTF32, 3: GlyphID
  switch (encoding) {
    case 1:
      return SkTextEncoding::kUTF16;
    case 2:
      return SkTextEncoding::kUTF32;
    case 3:
      return SkTextEncoding::kGlyphID;
    case 0:
    default:
      return SkTextEncoding::kUTF8;
  }
}

SkMatrix MatrixFromPtr(const float* m9) {
  if (!m9) {
    return SkMatrix::I();
  }
  // SkMatrix uses [scaleX, skewX, transX, skewY, scaleY, transY, persp0, persp1, persp2]
  return SkMatrix::MakeAll(
    m9[0], m9[1], m9[2],
    m9[3], m9[4], m9[5],
    m9[6], m9[7], m9[8]);
}

}  // namespace

extern "C" {

// Paint
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

void Paint_setStrokeCap(void* paint, int cap) {
  static_cast<SkPaint*>(paint)->setStrokeCap(static_cast<SkPaint::Cap>(cap));
}

void Paint_setStrokeJoin(void* paint, int join) {
  static_cast<SkPaint*>(paint)->setStrokeJoin(static_cast<SkPaint::Join>(join));
}

void Paint_setAlphaf(void* paint, float a) {
  static_cast<SkPaint*>(paint)->setAlphaf(a);
}

void Paint_setBlendMode(void* paint, int mode) {
  static_cast<SkPaint*>(paint)->setBlendMode(static_cast<SkBlendMode>(mode));
}

// Path
void* MakePath() {
  return new SkPathBuilder();
}

void DeletePath(void* path) {
  delete static_cast<SkPathBuilder*>(path);
}

void Path_setFillType(void* path, int fillType) {
  if (!path) {
    return;
  }
  static_cast<SkPathBuilder*>(path)->setFillType(static_cast<SkPathFillType>(fillType));
}

void Path_moveTo(void* path, float x, float y) {
  static_cast<SkPathBuilder*>(path)->moveTo(x, y);
}

void Path_lineTo(void* path, float x, float y) {
  static_cast<SkPathBuilder*>(path)->lineTo(x, y);
}

void Path_close(void* path) {
  static_cast<SkPathBuilder*>(path)->close();
}

void Path_reset(void* path) {
  static_cast<SkPathBuilder*>(path)->reset();
}

// Surface
void* MakeCanvasSurface(int width, int height) {
  return MakeRenderTargetSurface(width, height);
}

void* MakeSWCanvasSurface(int width, int height) {
  return MakeRasterSurface(width, height);
}

void DeleteSurface(void* surface) {
  SkSafeUnref(static_cast<SkSurface*>(surface));
}

void* Surface_getCanvas(void* surface) {
  return static_cast<SkSurface*>(surface)->getCanvas();
}

void Surface_flush(void* surface) {
  SkSurface* s = static_cast<SkSurface*>(surface);
  skgpu::ganesh::FlushAndSubmit(s);
}

int Surface_width(void* surface) {
  return static_cast<SkSurface*>(surface)->width();
}

int Surface_height(void* surface) {
  return static_cast<SkSurface*>(surface)->height();
}

// Create a snapshot image. Caller must DeleteImage().
void* Surface_makeImageSnapshot(void* surface) {
  sk_sp<SkImage> image = static_cast<SkSurface*>(surface)->makeImageSnapshot();
  if (!image) {
    return nullptr;
  }
  SkSafeRef(image.get());
  return image.get();
}

// Encodes the surface pixels as PNG and returns a SkData*. Caller must DeleteData().
void* Surface_encodeToPNG(void* surface) {
  if (!surface) {
    return nullptr;
  }
  SkSurface* s = static_cast<SkSurface*>(surface);
  const int w = s->width();
  const int h = s->height();
  if (w <= 0 || h <= 0) {
    return nullptr;
  }

  SkPixmap pixmap;
  std::unique_ptr<uint8_t[]> owned;

  // Prefer native pixmap (typically N32 premul) when available.
  if (!s->peekPixels(&pixmap)) {
    SkImageInfo info = SkImageInfo::MakeN32Premul(w, h);
    const size_t rowBytes = info.minRowBytes();
    const size_t byteSize = info.computeByteSize(rowBytes);
    if (byteSize == 0) {
      return nullptr;
    }
    owned.reset(new uint8_t[byteSize]);
    pixmap = SkPixmap(info, owned.get(), rowBytes);
    if (!s->readPixels(pixmap, 0, 0)) {
      return nullptr;
    }
  }

  SkDynamicMemoryWStream stream;
  SkPngEncoder::Options options;
  options.fFilterFlags = SkPngEncoder::FilterFlag::kNone;
  if (!SkPngEncoder::Encode(&stream, pixmap, options)) {
    return nullptr;
  }

  sk_sp<SkData> data = stream.detachAsData();
  if (!data) {
    return nullptr;
  }
  SkSafeRef(data.get());
  return data.get();
}

// Read RGBA pixels into caller-provided buffer (dst). Returns 1 on success.
int Surface_readPixelsRGBA8888(
  void* surface,
  int x,
  int y,
  int width,
  int height,
  void* dst,
  int dstRowBytes) {
  if (!surface || !dst || width <= 0 || height <= 0 || dstRowBytes <= 0) {
    return 0;
  }
  SkImageInfo info = SkImageInfo::Make(
    width,
    height,
    kRGBA_8888_SkColorType,
    kPremul_SkAlphaType);
  SkPixmap pixmap(info, dst, dstRowBytes);
  return static_cast<SkSurface*>(surface)->readPixels(pixmap, x, y) ? 1 : 0;
}

// Canvas
void Canvas_clear(void* canvas, uint32_t color) {
  static_cast<SkCanvas*>(canvas)->clear(color);
}

void Canvas_drawRect(void* canvas, float left, float top, float right, float bottom, void* paint) {
  const SkRect rect = SkRect::MakeLTRB(left, top, right, bottom);
  static_cast<SkCanvas*>(canvas)->drawRect(rect, *static_cast<SkPaint*>(paint));
}

void Canvas_drawPath(void* canvas, void* path, void* paint) {
  SkPathBuilder* builder = static_cast<SkPathBuilder*>(path);
  SkPath snapshot = builder->snapshot();
  static_cast<SkCanvas*>(canvas)->drawPath(snapshot, *static_cast<SkPaint*>(paint));
}

void Canvas_drawSkPath(void* canvas, void* skPath, void* paint) {
  if (!canvas || !skPath || !paint) {
    return;
  }
  static_cast<SkCanvas*>(canvas)->drawPath(
    *static_cast<SkPath*>(skPath),
    *static_cast<SkPaint*>(paint));
}

void Canvas_drawCircle(void* canvas, float cx, float cy, float radius, void* paint) {
  static_cast<SkCanvas*>(canvas)->drawCircle(cx, cy, radius, *static_cast<SkPaint*>(paint));
}

void Canvas_drawLine(void* canvas, float x0, float y0, float x1, float y1, void* paint) {
  static_cast<SkCanvas*>(canvas)->drawLine(x0, y0, x1, y1, *static_cast<SkPaint*>(paint));
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

void Canvas_concat(void* canvas, const float* m9) {
  if (!canvas) {
    return;
  }
  static_cast<SkCanvas*>(canvas)->concat(MatrixFromPtr(m9));
}

void Canvas_setMatrix(void* canvas, const float* m9) {
  if (!canvas) {
    return;
  }
  static_cast<SkCanvas*>(canvas)->setMatrix(MatrixFromPtr(m9));
}

void Canvas_clipRect(
  void* canvas,
  float left,
  float top,
  float right,
  float bottom,
  int clipOp,
  bool doAA) {
  if (!canvas) {
    return;
  }
  const SkRect rect = SkRect::MakeLTRB(left, top, right, bottom);
  static_cast<SkCanvas*>(canvas)->clipRect(rect, static_cast<SkClipOp>(clipOp), doAA);
}

void Canvas_drawImage(void* canvas, void* image, float x, float y, int filterMode, int mipmapMode) {
  if (!canvas || !image) {
    return;
  }
  SkSamplingOptions sampling(ToFilterMode(filterMode), ToMipmapMode(mipmapMode));
  static_cast<SkCanvas*>(canvas)->drawImage(static_cast<SkImage*>(image), x, y, sampling, nullptr);
}

void Canvas_drawImageWithPaint(
  void* canvas,
  void* image,
  float x,
  float y,
  int filterMode,
  int mipmapMode,
  void* paint) {
  if (!canvas || !image) {
    return;
  }
  SkSamplingOptions sampling(ToFilterMode(filterMode), ToMipmapMode(mipmapMode));
  static_cast<SkCanvas*>(canvas)->drawImage(
    static_cast<SkImage*>(image),
    x,
    y,
    sampling,
    static_cast<SkPaint*>(paint));
}

void Canvas_drawImageRect(
  void* canvas,
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
  int mipmapMode) {
  if (!canvas || !image) {
    return;
  }
  const SkRect src = SkRect::MakeLTRB(srcLeft, srcTop, srcRight, srcBottom);
  const SkRect dst = SkRect::MakeLTRB(dstLeft, dstTop, dstRight, dstBottom);
  SkSamplingOptions sampling(ToFilterMode(filterMode), ToMipmapMode(mipmapMode));
  static_cast<SkCanvas*>(canvas)->drawImageRect(static_cast<SkImage*>(image),
                                               src,
                                               dst,
                                               sampling,
                                               nullptr,
                                               SkCanvas::kFast_SrcRectConstraint);
}

void Canvas_drawImageRectWithPaint(
  void* canvas,
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
  int mipmapMode,
  void* paint) {
  if (!canvas || !image) {
    return;
  }
  const SkRect src = SkRect::MakeLTRB(srcLeft, srcTop, srcRight, srcBottom);
  const SkRect dst = SkRect::MakeLTRB(dstLeft, dstTop, dstRight, dstBottom);
  SkSamplingOptions sampling(ToFilterMode(filterMode), ToMipmapMode(mipmapMode));
  static_cast<SkCanvas*>(canvas)->drawImageRect(
    static_cast<SkImage*>(image),
    src,
    dst,
    sampling,
    static_cast<SkPaint*>(paint),
    SkCanvas::kFast_SrcRectConstraint);
}

// Image
void DeleteImage(void* image) {
  SkSafeUnref(static_cast<SkImage*>(image));
}

int Image_width(void* image) {
  return static_cast<SkImage*>(image)->width();
}

int Image_height(void* image) {
  return static_cast<SkImage*>(image)->height();
}

// Read RGBA pixels from the image into caller-provided buffer (dst). Returns 1 on success.
int Image_readPixelsRGBA8888(
  void* image,
  int x,
  int y,
  int width,
  int height,
  void* dst,
  int dstRowBytes) {
  if (!image || !dst || width <= 0 || height <= 0 || dstRowBytes <= 0) {
    return 0;
  }
  SkImageInfo info = SkImageInfo::Make(
    width,
    height,
    kRGBA_8888_SkColorType,
    kPremul_SkAlphaType);
  SkPixmap pixmap(info, dst, dstRowBytes);
  return static_cast<SkImage*>(image)->readPixels(pixmap, x, y) ? 1 : 0;
}

// Encodes the image as PNG and returns a SkData*. Caller must DeleteData().
void* Image_encodeToPNG(void* image) {
  if (!image) {
    return nullptr;
  }

  SkImage* img = static_cast<SkImage*>(image);

  // Avoid relying on peekPixels() which may fail for some backends and can
  // expose platform-native N32 channel order (often BGRA on little-endian).
  // Instead, read into a known RGBA_8888 buffer before encoding.
  const int w = img->width();
  const int h = img->height();
  if (w <= 0 || h <= 0) {
    return nullptr;
  }

  SkImageInfo info = SkImageInfo::Make(
    w,
    h,
    kRGBA_8888_SkColorType,
    kPremul_SkAlphaType);
  const size_t rowBytes = info.minRowBytes();
  const size_t byteSize = info.computeByteSize(rowBytes);
  if (byteSize == 0) {
    return nullptr;
  }

  std::unique_ptr<uint8_t[]> pixels(new uint8_t[byteSize]);
  SkPixmap pixmap(info, pixels.get(), rowBytes);
  if (!img->readPixels(pixmap, 0, 0)) {
    return nullptr;
  }

  SkDynamicMemoryWStream stream;
  SkPngEncoder::Options options;
  options.fFilterFlags = SkPngEncoder::FilterFlag::kNone;
  if (!SkPngEncoder::Encode(&stream, pixmap, options)) {
    return nullptr;
  }

  sk_sp<SkData> data = stream.detachAsData();
  if (!data) {
    return nullptr;
  }
  SkSafeRef(data.get());
  return data.get();
}

// Decodes an encoded image (png/jpg/webp...) from bytes. Caller must DeleteImage().
void* MakeImageFromEncoded(const void* bytes, int size) {
  if (!bytes || size <= 0) {
    return nullptr;
  }
  sk_sp<SkData> data = SkData::MakeWithCopy(bytes, static_cast<size_t>(size));
  if (!data) {
    return nullptr;
  }

  // Decode eagerly into a raster image. This is more reliable in static/wasm
  // builds where deferred decoding and registry-based generators may be
  // removed by dead-stripping.
  std::unique_ptr<SkCodec> codec = SkCodec::MakeFromData(data);
  if (!codec) {
    return nullptr;
  }

  SkImageInfo info = codec->getInfo().makeColorType(kRGBA_8888_SkColorType)
                                   .makeAlphaType(kPremul_SkAlphaType);
  const size_t rowBytes = info.minRowBytes();
  const size_t byteSize = info.computeByteSize(rowBytes);
  if (byteSize == 0) {
    return nullptr;
  }

  sk_sp<SkData> pixels = SkData::MakeUninitialized(byteSize);
  if (!pixels) {
    return nullptr;
  }

  SkCodec::Result r = codec->getPixels(info, pixels->writable_data(), rowBytes);
  if (r != SkCodec::kSuccess && r != SkCodec::kIncompleteInput) {
    return nullptr;
  }

  sk_sp<SkImage> img = SkImages::RasterFromData(info, pixels, rowBytes);
  if (!img) {
    return nullptr;
  }
  SkSafeRef(img.get());
  return img.get();
}

void DeleteData(void* data) {
  SkSafeUnref(static_cast<SkData*>(data));
}

const void* Data_bytes(void* data) {
  if (!data) {
    return nullptr;
  }
  return static_cast<SkData*>(data)->bytes();
}

int Data_size(void* data) {
  if (!data) {
    return 0;
  }
  return static_cast<int>(static_cast<SkData*>(data)->size());
}

// Shader
void DeleteShader(void* shader) {
  SkSafeUnref(static_cast<SkShader*>(shader));
}

void* MakeColorShader(uint32_t color) {
  sk_sp<SkShader> shader = SkShaders::Color(SkColor4f::FromColor(color), nullptr);
  if (!shader) {
    return nullptr;
  }
  SkSafeRef(shader.get());
  return shader.get();
}

// colors points to uint32_t[count]; positions points to float[count] or nullptr.
void* MakeLinearGradientShader(float x0,
                              float y0,
                              float x1,
                              float y1,
                              const uint32_t* colors,
                              const float* positions,
                              int count,
                              int tileMode) {
  if (!colors || count <= 0) {
    return nullptr;
  }

  std::vector<SkColor> skColors;
  skColors.reserve(static_cast<size_t>(count));
  for (int i = 0; i < count; i++) {
    skColors.push_back(static_cast<SkColor>(colors[i]));
  }

  const SkPoint pts[2] = {{x0, y0}, {x1, y1}};
  sk_sp<SkShader> shader = SkGradientShader::MakeLinear(
      pts,
      skColors.data(),
      positions,
      count,
      static_cast<SkTileMode>(tileMode),
      0,
      nullptr);
  if (!shader) {
    return nullptr;
  }
  SkSafeRef(shader.get());
  return shader.get();
}

void Paint_setShader(void* paint, void* shader) {
  if (!paint) {
    return;
  }
  sk_sp<SkShader> s = shader ? sk_ref_sp(static_cast<SkShader*>(shader)) : nullptr;
  static_cast<SkPaint*>(paint)->setShader(s);
}

// ColorFilter
void DeleteColorFilter(void* colorFilter) {
  SkSafeUnref(static_cast<SkColorFilter*>(colorFilter));
}

void* MakeBlendColorFilter(uint32_t color, int blendMode) {
  sk_sp<SkColorFilter> cf = SkColorFilters::Blend(color, static_cast<SkBlendMode>(blendMode));
  if (!cf) {
    return nullptr;
  }
  SkSafeRef(cf.get());
  return cf.get();
}

void Paint_setColorFilter(void* paint, void* colorFilter) {
  if (!paint) {
    return;
  }
  sk_sp<SkColorFilter> cf = colorFilter ? sk_ref_sp(static_cast<SkColorFilter*>(colorFilter))
                                        : nullptr;
  static_cast<SkPaint*>(paint)->setColorFilter(cf);
}

// Font
void* MakeFont() {
  return new SkFont();
}

void DeleteFont(void* font) {
  delete static_cast<SkFont*>(font);
}

void Font_setSize(void* font, float size) {
  static_cast<SkFont*>(font)->setSize(size);
}

void Font_setEdging(void* font, int edging) {
  static_cast<SkFont*>(font)->setEdging(static_cast<SkFont::Edging>(edging));
}

// Typeface
// Creates a typeface from font bytes (TTF/OTF/TTC). Caller must DeleteTypeface().
void* MakeTypefaceFromData(const void* bytes, int size, int ttcIndex) {
  if (!bytes || size <= 0) {
    return nullptr;
  }
  sk_sp<SkData> data = SkData::MakeWithCopy(bytes, static_cast<size_t>(size));
  if (!data) {
    return nullptr;
  }
  // Use a custom font manager over in-memory font bytes so we don't depend on
  // platform font discovery in the cheap/wasm environment.
  std::array<sk_sp<SkData>, 1> fonts = {data};
  sk_sp<SkFontMgr> mgr = SkFontMgr_New_Custom_Data(SkSpan(fonts));
  if (!mgr) {
    return nullptr;
  }
  sk_sp<SkTypeface> tf = mgr->makeFromData(std::move(data), ttcIndex);
  if (!tf) {
    return nullptr;
  }
  SkSafeRef(tf.get());
  return tf.get();
}

void DeleteTypeface(void* typeface) {
  SkSafeUnref(static_cast<SkTypeface*>(typeface));
}

void Font_setTypeface(void* font, void* typeface) {
  if (!font) {
    return;
  }
  sk_sp<SkTypeface> tf = typeface ? sk_ref_sp(static_cast<SkTypeface*>(typeface)) : nullptr;
  static_cast<SkFont*>(font)->setTypeface(tf);
}

// TextBlob
void DeleteTextBlob(void* blob) {
  SkSafeUnref(static_cast<SkTextBlob*>(blob));
}

// Creates a text blob from bytes. Caller must DeleteTextBlob().
void* MakeTextBlobFromText(const void* bytes, int byteLength, void* font, int encoding) {
  if (!bytes || byteLength <= 0 || !font) {
    return nullptr;
  }
  sk_sp<SkTextBlob> blob = SkTextBlob::MakeFromText(
    bytes,
    static_cast<size_t>(byteLength),
    *static_cast<SkFont*>(font),
    ToTextEncoding(encoding));
  if (!blob) {
    return nullptr;
  }
  SkSafeRef(blob.get());
  return blob.get();
}

void* MakeParagraphFromText(
  const char* utf8,
  int byteLength,
  const void* fontBytes,
  int fontByteLength,
  float fontSize,
  float wrapWidth,
  uint32_t color,
  int textAlign,
  int maxLines) {
  if (!utf8 || byteLength <= 0) {
    return nullptr;
  }

  // Keep backing font data alive for the lifetime of the paragraph handle.
  // SkFontMgr_New_Custom_Data stores a pointer to the provided SkData array.
  std::unique_ptr<CheapParagraph> handle = std::make_unique<CheapParagraph>();

  // Font manager from provided font bytes.
  sk_sp<SkFontMgr> fontMgr;
  if (fontBytes && fontByteLength > 0) {
    sk_sp<SkData> data = SkData::MakeWithCopy(fontBytes, fontByteLength);
    handle->fontDatas.push_back(std::move(data));
    fontMgr = SkFontMgr_New_Custom_Data(
        SkSpan<sk_sp<SkData>>(handle->fontDatas.data(), handle->fontDatas.size()));
  }
  if (!fontMgr) {
    // As a fallback (e.g. if no font bytes provided), use an empty font manager.
    fontMgr = SkFontMgr::RefEmpty();
  }
  if (!fontMgr) {
    return nullptr;
  }

  sk_sp<para::FontCollection> fontCollection = sk_make_sp<para::FontCollection>();
  fontCollection->setDefaultFontManager(fontMgr);

  SkString family;
  if (fontMgr->countFamilies() > 0) {
    fontMgr->getFamilyName(0, &family);
  }

  para::TextStyle ts;
  ts.setColor(static_cast<SkColor>(color));
  ts.setFontSize(fontSize);
  if (!family.isEmpty()) {
    std::vector<SkString> families;
    families.push_back(family);
    ts.setFontFamilies(std::move(families));
  }

  para::ParagraphStyle ps;
  ps.setTextStyle(ts);
  ps.setTextAlign(static_cast<para::TextAlign>(textAlign));
  if (maxLines > 0) {
    ps.setMaxLines(static_cast<size_t>(maxLines));
  }

  sk_sp<SkUnicode> unicode = MakeUnicode();
  if (!unicode) {
    return nullptr;
  }
  std::unique_ptr<para::ParagraphBuilder> builder =
      para::ParagraphBuilder::make(ps, fontCollection, unicode);
  if (!builder) {
    return nullptr;
  }

  builder->pushStyle(ts);
  builder->addText(utf8, static_cast<size_t>(byteLength));
  std::unique_ptr<para::Paragraph> paragraph = builder->Build();
  if (!paragraph) {
    return nullptr;
  }

  if (wrapWidth > 0) {
    paragraph->layout(wrapWidth);
  }

  handle->paragraph = std::move(paragraph);
  handle->fontCollection = std::move(fontCollection);
  handle->unicode = std::move(unicode);
  return handle.release();
}

void* MakeParagraphFromTextWithEllipsis(
  const char* utf8,
  int byteLength,
  const void* fontBytes,
  int fontByteLength,
  float fontSize,
  float wrapWidth,
  uint32_t color,
  int textAlign,
  int maxLines,
  const char* ellipsisUtf8,
  int ellipsisByteLength) {
  if (!utf8 || byteLength <= 0) {
    return nullptr;
  }

  std::unique_ptr<CheapParagraph> handle = std::make_unique<CheapParagraph>();

  sk_sp<SkFontMgr> fontMgr;
  if (fontBytes && fontByteLength > 0) {
    sk_sp<SkData> data = SkData::MakeWithCopy(fontBytes, fontByteLength);
    handle->fontDatas.push_back(std::move(data));
    fontMgr = SkFontMgr_New_Custom_Data(
        SkSpan<sk_sp<SkData>>(handle->fontDatas.data(), handle->fontDatas.size()));
  }
  if (!fontMgr) {
    fontMgr = SkFontMgr::RefEmpty();
  }
  if (!fontMgr) {
    return nullptr;
  }

  sk_sp<para::FontCollection> fontCollection = sk_make_sp<para::FontCollection>();
  fontCollection->setDefaultFontManager(fontMgr);

  SkString family;
  if (fontMgr->countFamilies() > 0) {
    fontMgr->getFamilyName(0, &family);
  }

  para::TextStyle ts;
  ts.setColor(static_cast<SkColor>(color));
  ts.setFontSize(fontSize);
  if (!family.isEmpty()) {
    std::vector<SkString> families;
    families.push_back(family);
    ts.setFontFamilies(std::move(families));
  }

  para::ParagraphStyle ps;
  ps.setTextStyle(ts);
  ps.setTextAlign(static_cast<para::TextAlign>(textAlign));
  if (maxLines > 0) {
    ps.setMaxLines(static_cast<size_t>(maxLines));
  }
  if (ellipsisUtf8 && ellipsisByteLength > 0) {
    SkString ellipsis(ellipsisUtf8, static_cast<size_t>(ellipsisByteLength));
    ps.setEllipsis(ellipsis);
  }

  sk_sp<SkUnicode> unicode = MakeUnicode();
  if (!unicode) {
    return nullptr;
  }

  std::unique_ptr<para::ParagraphBuilder> builder =
      para::ParagraphBuilder::make(ps, fontCollection, unicode);
  if (!builder) {
    return nullptr;
  }

  builder->pushStyle(ts);
  builder->addText(utf8, static_cast<size_t>(byteLength));
  std::unique_ptr<para::Paragraph> paragraph = builder->Build();
  if (!paragraph) {
    return nullptr;
  }

  if (wrapWidth > 0) {
    paragraph->layout(wrapWidth);
  }

  handle->paragraph = std::move(paragraph);
  handle->fontCollection = std::move(fontCollection);
  handle->unicode = std::move(unicode);
  return handle.release();
}

void* MakeParagraphBuilder(
  const void* fontBytes,
  int fontByteLength,
  float fontSize,
  uint32_t color,
  int textAlign,
  int maxLines) {
  std::unique_ptr<CheapParagraphBuilder> handle = std::make_unique<CheapParagraphBuilder>();

  sk_sp<SkFontMgr> fontMgr;
  if (fontBytes && fontByteLength > 0) {
    sk_sp<SkData> data = SkData::MakeWithCopy(fontBytes, fontByteLength);
    handle->fontDatas.push_back(std::move(data));
    fontMgr = SkFontMgr_New_Custom_Data(
        SkSpan<sk_sp<SkData>>(handle->fontDatas.data(), handle->fontDatas.size()));
  }
  if (!fontMgr) {
    fontMgr = SkFontMgr::RefEmpty();
  }
  if (!fontMgr) {
    return nullptr;
  }

  handle->fontCollection = sk_make_sp<para::FontCollection>();
  handle->fontCollection->setDefaultFontManager(fontMgr);

  if (fontMgr->countFamilies() > 0) {
    fontMgr->getFamilyName(0, &handle->family);
  }

  handle->unicode = MakeUnicode();
  if (!handle->unicode) {
    return nullptr;
  }

  para::TextStyle ts;
  ts.setColor(static_cast<SkColor>(color));
  ts.setFontSize(fontSize);
  if (!handle->family.isEmpty()) {
    std::vector<SkString> families;
    families.push_back(handle->family);
    ts.setFontFamilies(std::move(families));
  }

  para::ParagraphStyle ps;
  ps.setTextStyle(ts);
  ps.setTextAlign(static_cast<para::TextAlign>(textAlign));
  if (maxLines > 0) {
    ps.setMaxLines(static_cast<size_t>(maxLines));
  }

  handle->builder = para::ParagraphBuilder::make(ps, handle->fontCollection, handle->unicode);
  if (!handle->builder) {
    return nullptr;
  }

  // Default/base style
  handle->builder->pushStyle(ts);
  return handle.release();
}

void* MakeParagraphBuilderWithEllipsis(
  const void* fontBytes,
  int fontByteLength,
  float fontSize,
  uint32_t color,
  int textAlign,
  int maxLines,
  const char* ellipsisUtf8,
  int ellipsisByteLength) {
  std::unique_ptr<CheapParagraphBuilder> handle = std::make_unique<CheapParagraphBuilder>();

  sk_sp<SkFontMgr> fontMgr;
  if (fontBytes && fontByteLength > 0) {
    sk_sp<SkData> data = SkData::MakeWithCopy(fontBytes, fontByteLength);
    handle->fontDatas.push_back(std::move(data));
    fontMgr = SkFontMgr_New_Custom_Data(
        SkSpan<sk_sp<SkData>>(handle->fontDatas.data(), handle->fontDatas.size()));
  }
  if (!fontMgr) {
    fontMgr = SkFontMgr::RefEmpty();
  }
  if (!fontMgr) {
    return nullptr;
  }

  handle->fontCollection = sk_make_sp<para::FontCollection>();
  handle->fontCollection->setDefaultFontManager(fontMgr);

  if (fontMgr->countFamilies() > 0) {
    fontMgr->getFamilyName(0, &handle->family);
  }

  handle->unicode = MakeUnicode();
  if (!handle->unicode) {
    return nullptr;
  }

  para::TextStyle ts;
  ts.setColor(static_cast<SkColor>(color));
  ts.setFontSize(fontSize);
  if (!handle->family.isEmpty()) {
    std::vector<SkString> families;
    families.push_back(handle->family);
    ts.setFontFamilies(std::move(families));
  }

  para::ParagraphStyle ps;
  ps.setTextStyle(ts);
  ps.setTextAlign(static_cast<para::TextAlign>(textAlign));
  if (maxLines > 0) {
    ps.setMaxLines(static_cast<size_t>(maxLines));
  }
  if (ellipsisUtf8 && ellipsisByteLength > 0) {
    SkString ellipsis(ellipsisUtf8, static_cast<size_t>(ellipsisByteLength));
    ps.setEllipsis(ellipsis);
  }

  handle->builder = para::ParagraphBuilder::make(ps, handle->fontCollection, handle->unicode);
  if (!handle->builder) {
    return nullptr;
  }

  handle->builder->pushStyle(ts);
  return handle.release();
}

void ParagraphBuilder_pushStyle(void* builder, float fontSize, uint32_t color) {
  if (!builder) return;
  auto* b = static_cast<CheapParagraphBuilder*>(builder);
  if (!b->builder) return;

  para::TextStyle ts;
  ts.setColor(static_cast<SkColor>(color));
  ts.setFontSize(fontSize);
  if (!b->family.isEmpty()) {
    std::vector<SkString> families;
    families.push_back(b->family);
    ts.setFontFamilies(std::move(families));
  }
  b->builder->pushStyle(ts);
}

void ParagraphBuilder_pop(void* builder) {
  if (!builder) return;
  auto* b = static_cast<CheapParagraphBuilder*>(builder);
  if (!b->builder) return;
  b->builder->pop();
}

void ParagraphBuilder_addText(void* builder, const char* utf8, int byteLength) {
  if (!builder || !utf8 || byteLength <= 0) return;
  auto* b = static_cast<CheapParagraphBuilder*>(builder);
  if (!b->builder) return;
  b->builder->addText(utf8, static_cast<size_t>(byteLength));
}

void* ParagraphBuilder_build(void* builder, float wrapWidth) {
  if (!builder) return nullptr;
  std::unique_ptr<CheapParagraphBuilder> b(static_cast<CheapParagraphBuilder*>(builder));
  if (!b->builder) return nullptr;

  std::unique_ptr<para::Paragraph> paragraph = b->builder->Build();
  if (!paragraph) return nullptr;
  if (wrapWidth > 0) {
    paragraph->layout(wrapWidth);
  }

  std::unique_ptr<CheapParagraph> handle = std::make_unique<CheapParagraph>();
  handle->paragraph = std::move(paragraph);
  handle->fontCollection = std::move(b->fontCollection);
  handle->unicode = std::move(b->unicode);
  handle->fontDatas = std::move(b->fontDatas);
  return handle.release();
}

void DeleteParagraphBuilder(void* builder) {
  delete static_cast<CheapParagraphBuilder*>(builder);
}

void Paragraph_layout(void* paragraph, float width) {
  if (!paragraph) return;
  auto* p = static_cast<CheapParagraph*>(paragraph);
  if (!p->paragraph) return;
  p->paragraph->layout(width);
}

float Paragraph_getHeight(void* paragraph) {
  if (!paragraph) return 0.0f;
  auto* p = static_cast<CheapParagraph*>(paragraph);
  if (!p->paragraph) return 0.0f;
  return p->paragraph->getHeight();
}

float Paragraph_getMaxWidth(void* paragraph) {
  if (!paragraph) return 0.0f;
  auto* p = static_cast<CheapParagraph*>(paragraph);
  if (!p->paragraph) return 0.0f;
  return p->paragraph->getMaxWidth();
}

float Paragraph_getMinIntrinsicWidth(void* paragraph) {
  if (!paragraph) return 0.0f;
  auto* p = static_cast<CheapParagraph*>(paragraph);
  if (!p->paragraph) return 0.0f;
  return p->paragraph->getMinIntrinsicWidth();
}

float Paragraph_getMaxIntrinsicWidth(void* paragraph) {
  if (!paragraph) return 0.0f;
  auto* p = static_cast<CheapParagraph*>(paragraph);
  if (!p->paragraph) return 0.0f;
  return p->paragraph->getMaxIntrinsicWidth();
}

float Paragraph_getLongestLine(void* paragraph) {
  if (!paragraph) return 0.0f;
  auto* p = static_cast<CheapParagraph*>(paragraph);
  if (!p->paragraph) return 0.0f;
  return p->paragraph->getLongestLine();
}

void Canvas_drawParagraph(void* canvas, void* paragraph, float x, float y) {
  if (!canvas || !paragraph) return;
  auto* p = static_cast<CheapParagraph*>(paragraph);
  if (!p->paragraph) return;
  p->paragraph->paint(static_cast<SkCanvas*>(canvas), x, y);
}

void DeleteParagraph(void* paragraph) {
  delete static_cast<CheapParagraph*>(paragraph);
}

void Canvas_drawTextBlob(void* canvas, void* blob, float x, float y, void* paint) {
  if (!canvas || !blob || !paint) {
    return;
  }
  static_cast<SkCanvas*>(canvas)->drawTextBlob(
    static_cast<SkTextBlob*>(blob),
    x,
    y,
    *static_cast<SkPaint*>(paint));
}

// Path (extended)
void Path_quadTo(void* path, float x1, float y1, float x2, float y2) {
  static_cast<SkPathBuilder*>(path)->quadTo(x1, y1, x2, y2);
}

void Path_cubicTo(
  void* path,
  float x1,
  float y1,
  float x2,
  float y2,
  float x3,
  float y3) {
  static_cast<SkPathBuilder*>(path)->cubicTo(x1, y1, x2, y2, x3, y3);
}

void Path_addRect(void* path, float left, float top, float right, float bottom) {
  const SkRect rect = SkRect::MakeLTRB(left, top, right, bottom);
  static_cast<SkPathBuilder*>(path)->addRect(rect);
}

void Path_addCircle(void* path, float cx, float cy, float r) {
  static_cast<SkPathBuilder*>(path)->addCircle(cx, cy, r);
}

void Path_addOval(void* path, float left, float top, float right, float bottom, int dir, int startIndex) {
  if (!path) {
    return;
  }
  const SkRect oval = SkRect::MakeLTRB(left, top, right, bottom);
  static_cast<SkPathBuilder*>(path)->addOval(oval, static_cast<SkPathDirection>(dir), startIndex);
}

void Path_addRRectXY(
  void* path,
  float left,
  float top,
  float right,
  float bottom,
  float rx,
  float ry,
  int dir,
  int startIndex) {
  if (!path) {
    return;
  }
  const SkRect rect = SkRect::MakeLTRB(left, top, right, bottom);
  SkRRect rr;
  rr.setRectXY(rect, rx, ry);
  static_cast<SkPathBuilder*>(path)->addRRect(rr, static_cast<SkPathDirection>(dir), startIndex);
}

void Path_addPolygon(void* path, const float* pointsXY, int pointCount, int close) {
  if (!path || !pointsXY || pointCount <= 0) {
    return;
  }

  std::vector<SkPoint> pts;
  pts.reserve(static_cast<size_t>(pointCount));
  for (int i = 0; i < pointCount; i++) {
    const float x = pointsXY[i * 2 + 0];
    const float y = pointsXY[i * 2 + 1];
    pts.push_back(SkPoint::Make(x, y));
  }

  static_cast<SkPathBuilder*>(path)->addPolygon(
      SkSpan<const SkPoint>(pts.data(), pts.size()), close != 0);
}

void Path_addArc(
  void* path,
  float left,
  float top,
  float right,
  float bottom,
  float startAngleDeg,
  float sweepAngleDeg) {
  if (!path) {
    return;
  }
  const SkRect oval = SkRect::MakeLTRB(left, top, right, bottom);
  static_cast<SkPathBuilder*>(path)->addArc(oval, startAngleDeg, sweepAngleDeg);
}

void Path_arcToOval(
  void* path,
  float left,
  float top,
  float right,
  float bottom,
  float startAngleDeg,
  float sweepAngleDeg,
  int forceMoveTo) {
  if (!path) {
    return;
  }
  const SkRect oval = SkRect::MakeLTRB(left, top, right, bottom);
  static_cast<SkPathBuilder*>(path)->arcTo(oval, startAngleDeg, sweepAngleDeg, forceMoveTo != 0);
}

// Snapshot PathBuilder to an SkPath*. Caller must DeleteSkPath().
void* Path_snapshot(void* path) {
  if (!path) {
    return nullptr;
  }
  SkPathBuilder* builder = static_cast<SkPathBuilder*>(path);
  return new SkPath(builder->snapshot());
}

void DeleteSkPath(void* skPath) {
  delete static_cast<SkPath*>(skPath);
}

void Path_transform(void* skPath, const float* m9) {
  if (!skPath) {
    return;
  }
  SkPath* p = static_cast<SkPath*>(skPath);
  *p = p->makeTransform(MatrixFromPtr(m9));
}

}  // extern "C"
