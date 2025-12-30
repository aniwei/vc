#!/usr/bin/env bash

# Build CanvasKit as a cheap-compatible Wasm (no JS glue)
#
# Output: $SKIA_DIR/out/canvaskit_wasm_cheap_no_glue/canvaskit.wasm
#
# Requirements:
# - Emscripten SDK is vendored in this repo at third_party/externals/emsdk
# - A Skia wasm static build directory must exist (default: out/canvaskit_wasm_cheap2)

set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKIA_DIR="$(cd "${BASE_DIR}/../.." && pwd)"

# Existing Skia build output (provides libskia.a, libskcms.a, libwuffs.a)
SKIA_BUILD_DIR="${SKIA_BUILD_DIR:-${SKIA_DIR}/out/canvaskit_wasm_cheap2}"

OUT_DIR="${OUT_DIR:-${SKIA_DIR}/out/canvaskit_wasm_cheap_no_glue}"
mkdir -p "${OUT_DIR}"

EMSDK_DIR="${EMSDK_DIR:-${SKIA_DIR}/third_party/externals/emsdk}"
# shellcheck disable=SC1090
source "${EMSDK_DIR}/emsdk_env.sh" >/dev/null 2>&1 || true

EMXX="${EMXX:-${EMSDK_DIR}/upstream/emscripten/em++}"

if [[ ! -x "${EMXX}" ]]; then
  echo "error: em++ not found or not executable at ${EMXX}" >&2
  echo "hint: ensure EMSDK_DIR points at a valid emsdk checkout and run 'emsdk install' + 'emsdk activate'" >&2
  exit 1
fi

if [[ ! -f "${SKIA_BUILD_DIR}/libskia.a" ]]; then
  echo "error: libskia.a not found in ${SKIA_BUILD_DIR}" >&2
  echo "hint: build it first via modules/canvaskit/compile.sh (or your Skia GN build)" >&2
  exit 1
fi

# CanvasKit's GN build produces image codec objects under obj/src/codec but they
# are not archived into libskia.a in this configuration. Include them explicitly
# so MakeImageFromEncoded can decode PNG/JPG/WebP.
shopt -s nullglob
CODEC_OBJS=("${SKIA_BUILD_DIR}/obj/src/codec"/*.o)
shopt -u nullglob

if [[ ${#CODEC_OBJS[@]} -eq 0 ]]; then
  echo "error: codec object files not found in ${SKIA_BUILD_DIR}/obj/src/codec" >&2
  echo "hint: ensure SKIA_BUILD_DIR is a CanvasKit GN build output (e.g. run modules/canvaskit/compile.sh first)" >&2
  exit 1
fi

"${EMXX}" \
  -O3 \
  -std=c++20 \
  '-DSK_TRIVIAL_ABI=[[clang::trivial_abi]]' \
  -DSK_UNICODE_AVAILABLE \
  -DSK_UNICODE_ICU_IMPLEMENTATION \
  "${BASE_DIR}/src/canvaskit_bindings.cpp" \
  "${CODEC_OBJS[@]}" \
  -I"${SKIA_DIR}" \
  -I"${SKIA_DIR}/include/core" \
  -I"${SKIA_DIR}/include/effects" \
  -I"${SKIA_DIR}/include/gpu" \
  -I"${SKIA_DIR}/include/pathops" \
  -I"${SKIA_DIR}/include/utils" \
  -L"${SKIA_BUILD_DIR}" \
  -Wl,--start-group \
  -lskia -lskparagraph -lskshaper -lskunicode_core -lskunicode_icu -lskcms -lwuffs \
  -lharfbuzz -lfreetype2 -licu -ljsonreader \
  -lpng -lzlib \
  -ljpeg -lwebp -lwebp_sse41 -lbrotli \
  -Wl,--end-group \
  -sWASM=1 \
  -sFILESYSTEM=0 \
  -sFETCH=0 \
  -sASSERTIONS=0 \
  -sIMPORTED_MEMORY=1 \
  -sALLOW_MEMORY_GROWTH=1 \
  -sUSE_PTHREADS=0 \
  -sMAIN_MODULE=2 \
  -sSIDE_MODULE=0 \
  -sMALLOC=none \
  -sERROR_ON_UNDEFINED_SYMBOLS=0 \
  -sEXPORTED_FUNCTIONS='["_malloc","_free","_SkPathFillType_Winding","_SkPathFillType_EvenOdd","_SkPathFillType_InverseWinding","_SkPathFillType_InverseEvenOdd","_SkPaintStyle_Fill","_SkPaintStyle_Stroke","_SkPaintStyle_StrokeAndFill","_SkFilterMode_Nearest","_SkFilterMode_Linear","_SkMipmapMode_None","_SkMipmapMode_Nearest","_SkMipmapMode_Linear","_SkClipOp_Difference","_SkClipOp_Intersect","_SkTextDirection_LTR","_SkTextDirection_RTL","_SkTextAlign_Left","_SkTextAlign_Right","_SkTextAlign_Center","_SkTextAlign_Justify","_SkTextAlign_Start","_SkTextAlign_End","_MakePaint","_DeletePaint","_Paint_setColor","_Paint_setAntiAlias","_Paint_setStyle","_Paint_setStrokeWidth","_Paint_setStrokeCap","_Paint_setStrokeJoin","_Paint_setAlphaf","_Paint_setBlendMode","_Paint_setShader","_Paint_setColorFilter","_MakePath","_DeletePath","_Path_setFillType","_Path_moveTo","_Path_lineTo","_Path_quadTo","_Path_cubicTo","_Path_close","_Path_reset","_Path_addRect","_Path_addCircle","_Path_addOval","_Path_addRRectXY","_Path_addPolygon","_Path_addArc","_Path_arcToOval","_Path_snapshot","_DeleteSkPath","_Path_transform","_Path_getBounds","_SkPath_getBounds","_MakeCanvasSurface","_MakeSWCanvasSurface","_DeleteSurface","_Surface_getCanvas","_Surface_flush","_Surface_width","_Surface_height","_Surface_makeImageSnapshot","_Surface_encodeToPNG","_Surface_readPixelsRGBA8888","_Canvas_clear","_Canvas_getSaveCount","_Canvas_drawRect","_Canvas_drawPath","_Canvas_drawSkPath","_Canvas_drawCircle","_Canvas_drawOval","_Canvas_drawLine","_Canvas_drawArc","_Canvas_drawPaint","_Canvas_drawImage","_Canvas_drawImageWithPaint","_Canvas_drawImageRect","_Canvas_drawImageRectWithPaint","_Canvas_drawTextBlob","_Canvas_drawParagraph","_Canvas_save","_Canvas_saveLayer","_Canvas_restore","_Canvas_restoreToCount","_Canvas_translate","_Canvas_scale","_Canvas_rotate","_Canvas_concat","_Canvas_setMatrix","_Canvas_clipRect","_DeleteImage","_Image_width","_Image_height","_Image_readPixelsRGBA8888","_Image_encodeToPNG","_MakeImageFromEncoded","_DeleteData","_Data_bytes","_Data_size","_DeleteShader","_MakeColorShader","_MakeLinearGradientShader","_DeleteColorFilter","_MakeBlendColorFilter","_MakeFont","_DeleteFont","_Font_setSize","_Font_setEdging","_MakeTypefaceFromData","_DeleteTypeface","_Font_setTypeface","_DeleteTextBlob","_MakeTextBlobFromText","_MakeParagraphFromText","_MakeParagraphFromTextWithEllipsis","_MakeParagraphBuilder","_MakeParagraphBuilderWithEllipsis","_ParagraphBuilder_pushStyle","_ParagraphBuilder_pop","_ParagraphBuilder_addText","_ParagraphBuilder_build","_DeleteParagraphBuilder","_Paragraph_layout","_Paragraph_getHeight","_Paragraph_getMaxWidth","_Paragraph_getMinIntrinsicWidth","_Paragraph_getMaxIntrinsicWidth","_Paragraph_getLongestLine","_DeleteParagraph"]' \
  --no-entry \
  -o "${OUT_DIR}/canvaskit.wasm"

echo "ok: ${OUT_DIR}/canvaskit.wasm"

# Optional: keep perf-web's public asset in sync for local runs and codegen.
VC_ROOT="$(cd "${BASE_DIR}/../../../../.." && pwd)"
PERF_WASM_DST="${VC_ROOT}/packages/perf-web/public/cheap/canvaskit.wasm"
if [[ -d "$(dirname "${PERF_WASM_DST}")" ]]; then
  cp -f "${OUT_DIR}/canvaskit.wasm" "${PERF_WASM_DST}"
  echo "ok: synced ${PERF_WASM_DST}"
fi
