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

  maybeInvoke<T = any>(name: string, ...args: any[]): T | null {
    const fn = this.resolver(name)
    if (!fn) {
      return null
    }
    return fn(...args) as T
  }

  hasExport(name: string): boolean {
    return !!this.resolver(name)
  }
}

export type { Ptr }
