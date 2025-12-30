import invariant from 'invariant'
import type { Ptr } from './types'

function isNodeLike(): boolean {
  return typeof process !== 'undefined' && !!(process as any).versions?.node
}

function isProbablyUrl(input: string): boolean {
  return /^https?:\/\//i.test(input) || (typeof window !== 'undefined' && input.startsWith('/'))
}

export class WasmApi {
  #exports: Map<string, any> = new Map()
  #runner: any

  #getHeapU8: (() => Uint8Array) | null = null
  #memoryRef: any = null

  get exports() {
    return this.#exports
  }

  get runner() {
    invariant(this.#runner != null, 'Wasm runner is not initialized.')
    return this.#runner
  }

  get getHeapU8() {
    invariant(this.#getHeapU8 !== null, 'Wasm getHeapU8 is not initialized.')
    return this.#getHeapU8
  }

  get memoryRef() {
    invariant(this.#memoryRef !== null, 'Wasm MemoryRef is not initialized.')
    return this.#memoryRef
  }

  heapU8(): Uint8Array {
    return this.getHeapU8()
  }

  heapU32(): Uint32Array {
    return new Uint32Array(this.heapU8().buffer)
  }

  heapF32(): Float32Array {
    return new Float32Array(this.heapU8().buffer)
  }

  readBytes(ptr: Ptr, len: number): Buffer {
    return Buffer.from(this.heapU8().subarray(ptr >>> 0, (ptr + len) >>> 0))
  }

  writeBytes(ptr: Ptr, buf: Uint8Array): void {
    this.heapU8().set(buf, ptr >>> 0)
  }

  writeU32Array(ptr: Ptr, arr: Uint32Array): void {
    if (!arr.length) return
    this.heapU32().set(arr, (ptr >>> 0) >>> 2)
  }

  writeF32Array(ptr: Ptr, arr: Float32Array): void {
    if (!arr.length) return
    this.heapF32().set(arr, (ptr >>> 0) >>> 2)
  }

  // Prefer these names in new code.
  writeUint32Array(ptr: Ptr, values: ArrayLike<number> | Uint32Array): void {
    if (values instanceof Uint32Array) {
      this.writeU32Array(ptr, values)
      return
    }
    const len = values.length >>> 0
    if (!len) return
    const u32 = this.heapU32()
    const off = (ptr >>> 0) >>> 2
    for (let i = 0; i < len; i++) {
      u32[off + i] = (values[i]! >>> 0) as number
    }
  }

  writeFloat32Array(ptr: Ptr, values: ArrayLike<number> | Float32Array): void {
    if (values instanceof Float32Array) {
      this.writeF32Array(ptr, values)
      return
    }
    const len = values.length >>> 0
    if (!len) return
    const f32 = this.heapF32()
    const off = (ptr >>> 0) >>> 2
    for (let i = 0; i < len; i++) {
      f32[off + i] = +values[i]!
    }
  }

  alloc(bytes: Uint8Array): Ptr
  alloc(bytes: number | Uint8Array): Ptr {
    const size = typeof bytes === 'number' ? (bytes | 0) : bytes.length
    const ptr = this.malloc(size)
    if (ptr === 0) {
      throw new Error(`Wasm malloc failed to allocate ${size} bytes`)
    }

    if (bytes instanceof Uint8Array) {
      this.writeBytes(ptr, bytes)
    }

    return ptr
  }

  allocBytes(bytes: ArrayLike<number> | Uint8Array): Ptr {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayLike<number>)
    return this.alloc(u8)
  }

  malloc(size: number): Ptr {
    return this.invoke('malloc', size | 0) as number
  }

  free(ptr: Ptr): void {
    this.invoke('free', ptr >>> 0)
  }

  hasExport(name: string): boolean {
    return this.resolve(name) !== null
  }

  invoke(name: string, ...args: any[]): any {
    const fn = this.resolve(name)
    if (!fn) {
      throw new Error(`Wasm export not found: ${name}`)
    }
    return fn(...args)
  }

  resolve(name: string) {
    if (this.#exports.has(name)) {
      return this.#exports.get(name) ?? null
    }

    const asm = this.runner.asm as any
    if (!asm) {
      this.#exports.set(name, null)
      return null
    }

    if (typeof asm[name] === 'function') {
      this.#exports.set(name, asm[name])
      return asm[name]
    }

    const underscored = `_${name}`
    if (typeof asm[underscored] === 'function') {
      this.#exports.set(name, asm[underscored])
      return asm[underscored]
    }

    this.#exports.set(name, null)
    return null
  }

  attach(runner: any): void {
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
  
    // Emscripten MAIN_MODULE 构建可能通过 GOT.func 导入函数指针全局变量。
    // 这里用 i32 mutable global 作为占位，满足 instantiate 的类型要求。
    const gotFunc: Record<string, any> = {}
    imports['GOT.func'] = new Proxy(gotFunc, {
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
        this.heapU32()[(environCountPtr >>> 0) >>> 2] = 0
        this.heapU32()[(environBufSizePtr >>> 0) >>> 2] = 0
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
          const ptr = this.heapU32()[((iovs + i * 8) >>> 0) >>> 2] >>> 0
          const len = this.heapU32()[((iovs + i * 8 + 4) >>> 0) >>> 2] >>> 0
          if (len) {
            const chunk = this.readBytes(ptr, len)
            written += len
            if ((fd | 0) === 1) process.stdout.write(chunk)
            else if ((fd | 0) === 2) process.stderr.write(chunk)
          }
        }
        this.heapU32()[(nwrittenPtr >>> 0) >>> 2] = written >>> 0
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
        this.heapU32()[(nwrittenPtr >>> 0) >>> 2] = 0
        return 8 // EBADF
      }
    }
  
    if (typeof wasi.fd_seek !== 'function') {
      wasi.fd_seek = function fd_seek(_fd: number, _offsetLo: number, _offsetHi: number, _whence: number, newOffsetPtr: number) {
        this.heapU32()[(newOffsetPtr >>> 0) >>> 2] = 0
        this.heapU32()[(((newOffsetPtr >>> 0) + 4) >>> 0) >>> 2] = 0
        return 8 // EBADF
      }
    }
  
    if (typeof wasi.fd_pread !== 'function') {
      wasi.fd_pread = function fd_pread(_fd: number, _iovs: number, _iovsLen: number, _offsetLo: number, _offsetHi: number, nwrittenPtr: number) {
        this.heapU32()[(nwrittenPtr >>> 0) >>> 2] = 0
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

  async load(input: string): Promise<Uint8Array> {
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

  async run(input: string, opts: any = {}, stackSize: number = 0): Promise<void> {
    const wasmBytes = await this.load(input)
    const wasmSource = new Uint8Array(wasmBytes)

    const cheap = await import('@libmedia/cheap')
    const internal = await import('@libmedia/cheap/internal')

    const resource = await cheap.compileResource({ source: wasmSource })
    const runner = new cheap.WebAssemblyRunner(resource, { imports: opts.imports ?? {} })

    this.attach(runner)

    this.#getHeapU8 = internal.getHeapU8
    this.#memoryRef = cheap.Memory
    this.#runner = runner
    await this.runner.run(opts, stackSize)
  }
}
