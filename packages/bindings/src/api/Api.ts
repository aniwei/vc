import { WasmApi } from '../WasmApi'
import type { Ptr } from '../types'

export abstract class Api {
  #wasmApi: WasmApi

  constructor(wasmApi: WasmApi) {
    this.#wasmApi = wasmApi
  }

  invoke(funcName: string, ...args: any[]): any {
    return this.#wasmApi.invoke(funcName, ...args)
  }

  hasExport(name: string): boolean {
    return this.#wasmApi.hasExport(name)
  }

  protected malloc(size: number): Ptr {
    return this.#wasmApi.malloc(size)
  }

  protected free(ptr: Ptr): void {
    this.#wasmApi.free(ptr)
  }

  protected setFloat32Array(byteOffset: Ptr, values: ArrayLike<number> | Float32Array): void {
    this.#wasmApi.setFloat32Array(byteOffset, values)
  }

  
}

