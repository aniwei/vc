import { WasmApi } from '../WasmApi'

export abstract class Api {
  #wasmApi: WasmApi

  constructor(wasmApi: WasmApi) {
    this.#wasmApi = wasmApi
  }

  invoke(funcName: string, ...args: any[]): any {
    const func = this.#wasmApi.exports.get(funcName)
    if (!func) {
      throw new Error(`Function ${funcName} not found in Wasm exports`)
    }
    return func(...args)
  }

  
}

