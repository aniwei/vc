
import { PaintApi } from './api/PaintApi'
import { PathApi } from './api/PathApi'
import { SurfaceApi } from './api/SurfaceApi'
import { CanvasApi } from './api/CanvasApi'
import { ImageApi } from './api/ImageApi'

import type { Imports, Ptr } from './types'
import type { ExportResolver } from './api/Api'
import invariant from 'invariant'

export type { Imports, Ptr }

let MemoryRef: any = null
let getHeapU8Ref: (() => Uint8Array) | null = null

function ensureRuntimeReady(): void {
  if (!getHeapU8Ref) {
    throw new Error('CanvasKit runtime not initialized (missing getHeapU8)')
  }
}

function attachImportStubs(runner: any): void {
  const imports: Record<string, any> = (runner as any).imports ?? ((runner as any).imports = {})

  const baseEnv: Record<string, any> = imports.env ?? {}

  // 一些编解码器/库依赖 Emscripten 提供的这些辅助函数。
  // 在我们的无 glue 设置下提供尽力实现。
  if (typeof baseEnv.malloc_usable_size !== 'function') {
    baseEnv.malloc_usable_size = function malloc_usable_size(_ptr: number) {
      // 在自定义分配器下未知；返回 0 表示“未知/不可用”。
      return 0
    }
  }

  if (typeof baseEnv._emscripten_throw_longjmp !== 'function') {
    baseEnv._emscripten_throw_longjmp = function _emscripten_throw_longjmp(...args: any[]) {
      const err: any = new Error('emscripten longjmp')
      err.name = 'EmscriptenLongjmp'
      err.args = args
      throw err
    }
  }

  imports.env = new Proxy(baseEnv, {
    get(target, prop) {
      if (prop in target) return (target as any)[prop]
      if (prop === Symbol.toStringTag) return undefined

      // Emscripten MAIN_MODULE 构建可能会导入 invoke_* 辅助函数。
      // 这些是对间接函数表调用的包装。
      if (typeof prop === 'string' && prop.startsWith('invoke_')) {
        return function emscriptenInvokeWrapper(...args: any[]) {
          const fnPtr = args[0] | 0
          const table: WebAssembly.Table | undefined = (imports.env as any)?.__indirect_function_table

          if (!table) {
            throw new Error('Missing env.__indirect_function_table (required by invoke_*)')
          }

          const fn = table.get(fnPtr)
          if (typeof fn !== 'function') {
            throw new Error(`invoke_* target is not a function: ${fnPtr}`)
          }
          
          return (fn as any)(...args.slice(1))
        }
      }

      return function stubbedEnvImport() {
        return 0
      }
    },
  })

  // Emscripten MAIN_MODULE 构建可能通过 GOT.mem 导入栈边界。
  const gotMem: Record<string, any> = {
    __stack_low: new WebAssembly.Global({ value: 'i32', mutable: true }, 0),
    __stack_high: new WebAssembly.Global({ value: 'i32', mutable: true }, 0x7fffffff),
  }

  imports['GOT.mem'] = new Proxy(gotMem, {
    get(target, prop) {
      if (prop in target) {
        return (target as any)[prop]
      }
      if (prop === Symbol.toStringTag) {
        return undefined
      }
      
      return new WebAssembly.Global({ value: 'i32', mutable: true }, 0)
    },
  })

  const wasi: Record<string, any> = { ...(imports.wasi_snapshot_preview1 ?? {}) }

  // 为 Emscripten + musl 提供的最小 WASI 填充，适用于我们的无 glue 设置。
  // 仅实现启动和日志记录期间常用的子集。
  if (typeof wasi.proc_exit !== 'function') {
    wasi.proc_exit = function proc_exit(exitCode: number) {
      const err: any = new Error(`wasi proc_exit(${exitCode | 0})`)
      err.name = 'WasiProcExit'
      err.exitCode = exitCode | 0
      throw err
    }
  }

  if (typeof wasi.environ_sizes_get !== 'function') {
    wasi.environ_sizes_get = function environ_sizes_get(environCountPtr: number, environBufSizePtr: number) {
      // int* environCount, int* environBufSize
      heapU32()[(environCountPtr >>> 0) >>> 2] = 0
      heapU32()[(environBufSizePtr >>> 0) >>> 2] = 0
      return 0
    }
  }

  if (typeof wasi.environ_get !== 'function') {
    wasi.environ_get = function environ_get(_environPtr: number, _environBufPtr: number) {
      return 0
    }
  }

  if (typeof wasi.fd_write !== 'function') {
    wasi.fd_write = function fd_write(fd: number, iovs: number, iovsLen: number, nwrittenPtr: number) {
      let written = 0
      for (let i = 0; i < (iovsLen | 0); i++) {
        const ptr = heapU32()[((iovs + i * 8) >>> 0) >>> 2] >>> 0
        const len = heapU32()[((iovs + i * 8 + 4) >>> 0) >>> 2] >>> 0
        if (len) {
          const chunk = Buffer.from(heapU8().subarray(ptr, ptr + len))
          written += len
          if ((fd | 0) === 1) process.stdout.write(chunk)
          else if ((fd | 0) === 2) process.stderr.write(chunk)
        }
      }
      heapU32()[(nwrittenPtr >>> 0) >>> 2] = written >>> 0
      return 0
    }
  }

  if (typeof wasi.fd_close !== 'function') {
    wasi.fd_close = function fd_close(_fd: number) {
      return 0
    }
  }

  if (typeof wasi.fd_read !== 'function') {
    wasi.fd_read = function fd_read(_fd: number, _iovs: number, _iovsLen: number, nwrittenPtr: number) {
      heapU32()[(nwrittenPtr >>> 0) >>> 2] = 0
      return 8 // EBADF
    }
  }

  if (typeof wasi.fd_seek !== 'function') {
    wasi.fd_seek = function fd_seek(_fd: number, _offsetLo: number, _offsetHi: number, _whence: number, newOffsetPtr: number) {
      heapU32()[(newOffsetPtr >>> 0) >>> 2] = 0
      heapU32()[(((newOffsetPtr >>> 0) + 4) >>> 0) >>> 2] = 0
      return 8 // EBADF
    }
  }

  if (typeof wasi.fd_pread !== 'function') {
    wasi.fd_pread = function fd_pread(_fd: number, _iovs: number, _iovsLen: number, _offsetLo: number, _offsetHi: number, nwrittenPtr: number) {
      heapU32()[(nwrittenPtr >>> 0) >>> 2] = 0
      return 8 // EBADF
    }
  }

  imports.wasi_snapshot_preview1 = new Proxy(wasi, {
    get(target, prop) {
      if (prop in target) return (target as any)[prop]
      if (prop === Symbol.toStringTag) return undefined
      return function stubbedWasiImport() {
        return 52 // ENOSYS
      }
    },
  })
}

function heapU8(): Uint8Array {
  ensureRuntimeReady()
  return getHeapU8Ref!()
}

function heapU32(): Uint32Array {
  return new Uint32Array(heapU8().buffer)
}

function heapF32(): Float32Array {
  return new Float32Array(heapU8().buffer)
}

function readBytes(ptr: Ptr, len: number): Buffer {
  return Buffer.from(heapU8().subarray(ptr >>> 0, (ptr + len) >>> 0))
}

function writeBytes(ptr: Ptr, buf: Uint8Array): void {
  heapU8().set(buf, ptr >>> 0)
}

function writeU32Array(ptr: Ptr, arr: Uint32Array): void {
  if (!arr.length) return
  heapU32().set(arr, (ptr >>> 0) >>> 2)
}

function writeF32Array(ptr: Ptr, arr: Float32Array): void {
  if (!arr.length) return
  heapF32().set(arr, (ptr >>> 0) >>> 2)
}


function makeApi(runner: any) {
  const exports = new Map<string, ((...args: any[]) => any) | null>()

  function resolve(name: string): ((...args: any[]) => any) | null {
    if (exports.has(name)) {
      return exports.get(name) ?? null
    }

    const asm = runner.asm as any
    if (!asm) {
      exports.set(name, null)
      return null
    }

    if (typeof asm[name] === 'function') {
      exports.set(name, asm[name])
      return asm[name]
    }

    const underscored = `_${name}`
    if (typeof asm[underscored] === 'function') {
      exports.set(name, asm[underscored])
      return asm[underscored]
    }

    exports.set(name, null)
    return null
  }

  const resolver: ExportResolver = resolve

  const invoke = <T = any>(name: string, ...args: any[]): T => {
    const fn = resolve(name)
    
    if (!fn) {
      throw new Error(`CanvasKit wasm export not found: ${name}`)
    }

    return fn(...args) as T
  }

  const malloc = (size: number): Ptr => invoke('malloc', size | 0)
  const free = (ptr: Ptr): void => {
    invoke('free', ptr >>> 0)
  }

  const alloc = (bytes: Uint8Array): Ptr => {
    const ptr = malloc(bytes.length)
    writeBytes(ptr, bytes)
    return ptr
  }

  const allocBytes = (bytes: ArrayLike<number> | Uint8Array): Ptr => {
    const u8 = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes)
    return alloc(u8)
  }


  const api = {
    runner,

    // 内存
    malloc,
    free,
    invoke,
    alloc,
    allocBytes,

    Path: new PathApi(resolver),
    Paint: new PaintApi(resolver),
    Surface: new SurfaceApi(resolver),
    Canvas: new CanvasApi(resolver),
    Image: new ImageApi(resolver),
    
    Memory: MemoryRef,
  }

  return api
}

function isNodeLike(): boolean {
  return typeof process !== 'undefined' && !!(process as any).versions?.node
}

function isProbablyUrl(input: string): boolean {
  return /^https?:\/\//i.test(input) || (typeof window !== 'undefined' && input.startsWith('/'))
}

async function loadWasmBytes(input: string): Promise<Uint8Array> {
  if (!isNodeLike() || isProbablyUrl(input)) {
    const url = typeof window !== 'undefined' ? new URL(input, window.location.href).toString() : input
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`createCanvasKit: failed to fetch wasm: ${url} (${res.status})`)
    }

    return new Uint8Array(await res.arrayBuffer())
  }

  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const uri = path.resolve(process.cwd(), input)
  const buf = await fs.readFile(uri)

  return new Uint8Array(buf)
}

export interface CanvasKitOptions {
  uri?: string
  path?: string
  imports?: Imports
}

async function ready(options: CanvasKitOptions): Promise<ReturnType<typeof makeApi>> {
  const input = options.uri ?? options.path
  if (!input) {
    throw new Error('Expected options.uri, options.path, or options.wasmPath')
  }

  const cheap = await import('@libmedia/cheap')
  const cheapInternal = await import('@libmedia/cheap/internal')
  MemoryRef = cheap.Memory
  getHeapU8Ref = cheapInternal.getHeapU8

  const wasmBytes = await loadWasmBytes(input)
  const wasmSource = new Uint8Array(wasmBytes)

  const resource = await cheap.compileResource({ source: wasmSource })
  const runner = new cheap.WebAssemblyRunner(resource, { imports: options.imports ?? {} })
  attachImportStubs(runner)

  await runner.run({}, 0)
  return makeApi(runner)
}

export class CanvasKitApi {
  static async ready (options: CanvasKitOptions): Promise<ReturnType<typeof makeApi>> {
    if (this.#api !== null) {
      return this.#api
    }

    const api = await ready(options)
    this.#api = api

    return api
  }
  static #api: ReturnType<typeof makeApi> | null = null

  static get Path (): PathApi {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.Path
  }

  static get Paint (): PaintApi {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.Paint
  }

  static get Surface (): SurfaceApi {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.Surface
  }

  static get Canvas (): CanvasApi {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.Canvas
  }

  static get Image () {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.Image
  }

  static get Memory () {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.Memory
  }

  static invoke(name: string, ...args: any[]): any {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.invoke(name, ...args)
  }

  static malloc(size: number): Ptr {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.malloc(size)
  }

  static free(ptr: Ptr): void {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    this.#api.free(ptr)
  }

  static alloc(bytes: Uint8Array): Ptr {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.alloc(bytes)
  }

  static heapU8(): Uint8Array {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return heapU8()
  }

  static allocBytes(bytes: ArrayLike<number> | Uint8Array): Ptr {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.allocBytes(bytes)
  }
}