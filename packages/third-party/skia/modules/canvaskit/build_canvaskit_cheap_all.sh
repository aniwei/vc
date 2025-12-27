#!/usr/bin/env bash

# One-shot build for a cheap-compatible CanvasKit Wasm (no JS glue).
#
# This script:
# 1) Builds Skia static wasm libs via modules/canvaskit/compile.sh
# 2) Links a standalone Wasm using modules/canvaskit/build_canvaskit_cheap.sh
#
# Output (default):
#   third-party/skia/out/canvaskit_wasm_cheap_no_glue/canvaskit.wasm

set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKIA_DIR="$(cd "${BASE_DIR}/../.." && pwd)"

# Where to place Skia's wasm static build artifacts (libskia.a, libskcms.a, libwuffs.a)
SKIA_BUILD_DIR="${SKIA_BUILD_DIR:-${SKIA_DIR}/out/canvaskit_wasm_cheap2}"

# Where to place the final no-glue Wasm
OUT_DIR="${OUT_DIR:-${SKIA_DIR}/out/canvaskit_wasm_cheap_no_glue}"

# Forward any extra compile.sh flags (e.g. cpu, no_pathops, no_skottie, debug_build)
COMPILE_FLAGS=("$@")

echo "[1/2] Building Skia static wasm libs into: ${SKIA_BUILD_DIR}"
(
  cd "${SKIA_DIR}"
  BUILD_DIR="${SKIA_BUILD_DIR}" ./modules/canvaskit/compile.sh "${COMPILE_FLAGS[@]}"
)

echo "[2/2] Linking cheap-compatible no-glue wasm into: ${OUT_DIR}"
(
  cd "${SKIA_DIR}"
  SKIA_BUILD_DIR="${SKIA_BUILD_DIR}" OUT_DIR="${OUT_DIR}" ./modules/canvaskit/build_canvaskit_cheap.sh
)

echo "ok: ${OUT_DIR}/canvaskit.wasm"
