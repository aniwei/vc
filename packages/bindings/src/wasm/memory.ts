export interface WasmMemoryDeps {
  heapU8: () => Uint8Array
  malloc: (bytes: number) => number
  free: (ptr: number) => void
}

export interface WasmMemory {
  heapU8(): Uint8Array
  writeFloat32Array(ptr: number, values: ArrayLike<number>): void
  writeUint32Array(ptr: number, values: ArrayLike<number>): void
  allocFloat32Array(values: ArrayLike<number>): number
  readFloat32Array(ptr: number, length: number): Float32Array
  free(ptr: number): void
}

// Factory for dependency injection (e.g. multiple runners / test fakes).
export function createWasmMemory(deps: WasmMemoryDeps): WasmMemory {
  const heapU8 = deps.heapU8

  const writeFloat32Array = (ptr: number, values: ArrayLike<number>): void => {
    const heap = heapU8()
    const f32 = new Float32Array(heap.buffer)
    const off = (ptr >>> 0) >>> 2
    for (let i = 0; i < values.length; i++) {
      f32[off + i] = +values[i]!
    }
  }

  const writeUint32Array = (ptr: number, values: ArrayLike<number>): void => {
    const heap = heapU8()
    const u32 = new Uint32Array(heap.buffer)
    const off = (ptr >>> 0) >>> 2
    for (let i = 0; i < values.length; i++) {
      u32[off + i] = (values[i]! >>> 0) as number
    }
  }

  const allocFloat32Array = (values: ArrayLike<number>): number => {
    const ptr = deps.malloc(values.length * 4) as number
    writeFloat32Array(ptr, values)
    return ptr
  }

  const readFloat32Array = (ptr: number, length: number): Float32Array => {
    const heap = heapU8()
    return new Float32Array(heap.buffer, ptr >>> 0, length)
  }

  const free = (ptr: number): void => {
    deps.free(ptr >>> 0)
  }

  return {
    heapU8,
    writeFloat32Array,
    writeUint32Array,
    allocFloat32Array,
    readFloat32Array,
    free,
  }
}

// Default singleton bound to CanvasKitApi. These are call-through wrappers; they
// require CanvasKitApi.ready() to have been called before use.
import { CanvasKitApi } from '../CanvasKitApi'
import type { Ptr } from '../types'

const defaultMemory = createWasmMemory({
  heapU8: () => CanvasKitApi.heapU8(),
  malloc: (bytes: number) => CanvasKitApi.malloc(bytes) as number,
  free: (ptr: number) => CanvasKitApi.free(ptr as Ptr),
})

export const heapU8 = (): Uint8Array => defaultMemory.heapU8()

export const writeFloat32Array = (ptr: number, values: ArrayLike<number>): void =>
  defaultMemory.writeFloat32Array(ptr, values)

export const writeUint32Array = (ptr: number, values: ArrayLike<number>): void =>
  defaultMemory.writeUint32Array(ptr, values)

export const allocFloat32Array = (values: ArrayLike<number>): number => defaultMemory.allocFloat32Array(values)

export const readFloat32Array = (ptr: number, length: number): Float32Array => defaultMemory.readFloat32Array(ptr, length)

export const free = (ptr: number): void => defaultMemory.free(ptr)

// Back-compat aliases
export const writeF32Array = writeFloat32Array
export const writeU32Array = writeUint32Array
export const allocF32Array = allocFloat32Array
export const readF32 = (ptr: number, length: number): Float32Array => readFloat32Array(ptr, length)

