import { CanvasKitApi } from '../../CanvasKitApi'
import type { CanvasKit } from '../../CanvasKitApi'
import { getTestWasmPath } from '../../__tests__/helpers/ensureCanvasKit'

export async function getCanvasKit(): Promise<CanvasKit> {
  const wasmPath = process.env.CANVASKIT_WASM ?? getTestWasmPath()
  return await CanvasKitApi.ready({ path: wasmPath })
}
