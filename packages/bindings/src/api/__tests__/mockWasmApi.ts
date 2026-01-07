import type { WasmApi } from '../../WasmApi'

export type WasmInvokeCall = {
  name: string
  args: any[]
}

export function createMockWasmApi(impl?: {
  exports?: Record<string, (...args: any[]) => any>
  returns?: Record<string, any>
  hasExport?: (name: string) => boolean
}) {
  const exports = impl?.exports ?? {}
  const returns = impl?.returns ?? {}
  const calls: WasmInvokeCall[] = []

  const hasExport = impl?.hasExport ?? ((name: string) => typeof exports[name] === 'function')

  const wasm = {
    hasExport,
    invoke(name: string, ...args: any[]) {
      calls.push({ name, args })
      const fn = exports[name]
      if (fn) return fn(...args)
      if (name in returns) return returns[name]
      return 0
    },
  } as unknown as WasmApi

  return { wasm, calls }
}
