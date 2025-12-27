import type { Ptr } from '../types'

export type ExportResolver = (name: string) => ((...args: any[]) => any) | null

export abstract class Api {
  protected readonly resolver: ExportResolver

  constructor(resolver: ExportResolver) {
    this.resolver = resolver
  }

  invoke<T = any>(name: string, ...args: any[]): T {
    const fn = this.resolver(name)
    if (!fn) {
      throw new Error(`CanvasKit wasm export not found: ${name}`)
    }
    return fn(...args) as T
  }
}

export type { Ptr }
