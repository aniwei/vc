declare module '@libmedia/cheap' {
  export function compileResource(opts: { source: Uint8Array }): Promise<unknown>

  export class WebAssemblyRunner {
    constructor(resource: unknown, opts?: { imports?: Record<string, any> })
    imports: Record<string, any>
    asm?: Record<string, any>
    run(opts?: any, stackSize?: number): Promise<void>
    destroy(): void
  }

  // Keep type surface minimal; bindings only re-export it.
  export class Memory {}
}

declare module '@libmedia/cheap/internal' {
  export function getHeapU8(): Uint8Array
}
