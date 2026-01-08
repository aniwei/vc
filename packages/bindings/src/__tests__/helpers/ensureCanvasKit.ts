import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

import { CanvasKitApi } from '../../CanvasKitApi'

let readyPromise: Promise<void> | null = null

export function getTestWasmPath(): string {
  // Prefer a locally-built Skia wasm if present (more exports, e.g. Path_getBounds).
  // Fall back to the checked-in cheap wasm for deterministic runs (e.g. CI).
  const skiaOutWasm = fileURLToPath(
    new URL('../../../../third-party/skia/out/canvaskit_wasm_cheap_no_glue/canvaskit.wasm', import.meta.url),
  )
  if (fs.existsSync(skiaOutWasm)) {
    return skiaOutWasm
  }

  return fileURLToPath(new URL('../../../../workstation/public/cheap/canvaskit.wasm', import.meta.url))
}

export async function ensureCanvasKitReady(): Promise<void> {
  if (readyPromise) return readyPromise

  readyPromise = (async () => {
    const wasmPath = process.env.CANVASKIT_WASM ?? getTestWasmPath()
    await CanvasKitApi.ready({ path: wasmPath })
  })()

  return readyPromise
}
