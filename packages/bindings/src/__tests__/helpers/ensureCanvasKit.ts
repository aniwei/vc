import { fileURLToPath } from 'node:url'

import { CanvasKitApi } from '../../CanvasKitApi'

let readyPromise: Promise<void> | null = null

export function getTestWasmPath(): string {
  // Prefer a checked-in cheap wasm for deterministic tests.
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
