import { WasmApi } from '../WasmApi'

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

  
}

