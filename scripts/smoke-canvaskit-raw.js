/*
 * Raw Node smoke test for the no-glue CanvasKit Wasm.
 *
 * This bypasses cheap's TS runtime (which expects build-time macros/bundling)
 * and instead instantiates the Wasm with a minimal JS import object.
 *
 * It is ONLY a sanity check: exports exist, module instantiates, basic calls
 * don't trap. The allocator is a simplistic bump allocator.
 */

const fs = require('fs')
const path = require('path')

const defaultWasmPath = path.resolve(
  __dirname,
  '../packages/third-party/skia/out/canvaskit_wasm_cheap_no_glue/canvaskit.wasm'
)

const wasmPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultWasmPath

function readU32LEB(bytes, posObj) {
  let result = 0
  let shift = 0
  while (true) {
    const byte = bytes[posObj.pos++]
    result |= (byte & 0x7f) << shift
    if ((byte & 0x80) === 0) return result >>> 0
    shift += 7
  }
}

function readStr(bytes, posObj) {
  const len = readU32LEB(bytes, posObj)
  const start = posObj.pos
  posObj.pos += len
  return Buffer.from(bytes.subarray(start, start + len)).toString('utf8')
}

function parseImportLimits(wasmBytes) {
  const bytes = wasmBytes instanceof Uint8Array ? wasmBytes : new Uint8Array(wasmBytes)
  const posObj = { pos: 0 }

  // magic + version
  posObj.pos = 8

  let mem = null
  let table = null

  while (posObj.pos < bytes.length) {
    const sectionId = bytes[posObj.pos++]
    const sectionSize = readU32LEB(bytes, posObj)
    const sectionStart = posObj.pos

    if (sectionId === 2) {
      // Import section
      const count = readU32LEB(bytes, posObj)
      for (let i = 0; i < count; i++) {
        const mod = readStr(bytes, posObj)
        const name = readStr(bytes, posObj)
        const kind = bytes[posObj.pos++]

        if (kind === 2) {
          // memory
          const flags = readU32LEB(bytes, posObj)
          const initial = readU32LEB(bytes, posObj)
          const maximum = flags & 0x01 ? readU32LEB(bytes, posObj) : undefined
          mem = { module: mod, name, initial, maximum }
        } else if (kind === 1) {
          // table
          const elemType = bytes[posObj.pos++] // 0x70 funcref
          const flags = readU32LEB(bytes, posObj)
          const initial = readU32LEB(bytes, posObj)
          const maximum = flags & 0x01 ? readU32LEB(bytes, posObj) : undefined
          table = { module: mod, name, elemType, initial, maximum }
        } else if (kind === 3) {
          // global
          posObj.pos += 2
        } else if (kind === 0) {
          // func
          readU32LEB(bytes, posObj)
        } else {
          throw new Error(`unknown import kind ${kind}`)
        }
      }
      break
    }

    posObj.pos = sectionStart + sectionSize
  }

  return { mem, table }
}

function alignUp(x, a) {
  return (x + (a - 1)) & ~(a - 1)
}

async function main() {
  const wasm = fs.readFileSync(wasmPath)
  const module = new WebAssembly.Module(wasm)
  const importsMeta = WebAssembly.Module.imports(module)

  const { mem, table } = parseImportLimits(wasm)
  if (!mem || mem.module !== 'env' || mem.name !== 'memory') {
    throw new Error('failed to locate env.memory import limits')
  }
  if (!table || table.module !== 'env' || table.name !== '__indirect_function_table') {
    throw new Error('failed to locate env.__indirect_function_table import limits')
  }

  const memory = new WebAssembly.Memory({
    initial: mem.initial,
    maximum: mem.maximum,
  })

  const funcrefTable = new WebAssembly.Table({
    initial: table.initial,
    maximum: table.maximum,
    element: 'anyfunc',
  })

  // Put a generic stub at slot 0.
  try {
    funcrefTable.set(0, () => 0)
  } catch {
    // ignore
  }

  const pageSize = 65536
  const initialBytes = mem.initial * pageSize
  const stackTop = initialBytes - 16

  // Very simple bump allocator. Good enough for smoke tests.
  let heapPtr = 32 * 1024 * 1024
  const allocSizes = new Map()

  function ensureCapacity(endPtr) {
    const needBytes = endPtr + 16
    const currentBytes = memory.buffer.byteLength
    if (needBytes <= currentBytes) return
    const needPages = Math.ceil(needBytes / pageSize)
    const curPages = currentBytes / pageSize
    memory.grow(needPages - curPages)
  }

  function malloc(size) {
    size = size >>> 0
    const aligned = alignUp(size, 8)
    const p = heapPtr
    heapPtr += aligned
    ensureCapacity(heapPtr)
    allocSizes.set(p, aligned)
    return p >>> 0
  }

  function free(_p) {
    // no-op
  }

  function calloc(n, size) {
    const total = (n >>> 0) * (size >>> 0)
    const p = malloc(total)
    new Uint8Array(memory.buffer, p, total).fill(0)
    return p
  }

  function realloc(p, size) {
    if (!p) return malloc(size)
    const oldSize = allocSizes.get(p) || 0
    const np = malloc(size)
    const copy = Math.min(oldSize, size >>> 0)
    if (copy > 0) {
      new Uint8Array(memory.buffer, np, copy).set(new Uint8Array(memory.buffer, p, copy))
    }
    return np
  }

  function malloc_usable_size(p) {
    return (allocSizes.get(p) || 0) >>> 0
  }

  function posix_memalign(memptrPtr, alignment, size) {
    alignment = alignment >>> 0
    const p = malloc(size)
    const aligned = alignUp(p, Math.max(8, alignment))
    const dv = new DataView(memory.buffer)
    dv.setUint32(memptrPtr >>> 0, aligned >>> 0, true)
    return 0
  }

  // Build GOT.func globals expected by MAIN_MODULE=2.
  const gotFunc = {}
  for (const imp of importsMeta) {
    if (imp.module === 'GOT.func' && imp.kind === 'global') {
      gotFunc[imp.name] = new WebAssembly.Global({ mutable: true, value: 'i32' }, 0)
    }
  }

  const envBase = {
      memory,
      __indirect_function_table: funcrefTable,
      __stack_pointer: new WebAssembly.Global({ mutable: true, value: 'i32' }, stackTop >>> 0),
      __memory_base: new WebAssembly.Global({ mutable: false, value: 'i32' }, 0),
      __table_base: new WebAssembly.Global({ mutable: false, value: 'i32' }, 0),

      __libc_malloc: malloc,
      __libc_free: free,
      malloc: malloc,
      free: free,
      realloc,
      calloc,
      malloc_usable_size,
      posix_memalign,

      emscripten_builtin_malloc: malloc,
      emscripten_builtin_free: free,

      // In this smoke test we never touch GPU path.
      glGetString: () => 0,
  }

  // Some builds may leave unused symbols unresolved (MAIN_MODULE=2), which
  // turns them into imports. For smoke purposes we can stub unknown imports.
  const env = new Proxy(envBase, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (typeof prop !== 'string') return undefined
      const stub = () => 0
      target[prop] = stub
      return stub
    },
  })

  const wasiBase = {
    clock_time_get: () => 0,
    fd_close: () => 0,
    fd_write: () => 0,
    fd_seek: () => 0,
    environ_sizes_get: () => 0,
    environ_get: () => 0,
    proc_exit: () => 0,
  }

  const wasi = new Proxy(wasiBase, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (typeof prop !== 'string') return undefined
      const stub = () => 0
      target[prop] = stub
      return stub
    },
  })

  const imports = {
    env,
    'GOT.func': gotFunc,
    'GOT.mem': {
      __stack_low: new WebAssembly.Global({ mutable: true, value: 'i32' }, (stackTop - 1024 * 1024) >>> 0),
      __stack_high: new WebAssembly.Global({ mutable: true, value: 'i32' }, stackTop >>> 0),
    },
    wasi_snapshot_preview1: wasi,
  }

  const instantiated = await WebAssembly.instantiate(module, imports)
  const instance = instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance
  const e = instance.exports

  if (typeof e._initialize === 'function') {
    // Run ctors if present.
    e._initialize()
  }

  const surface = e.MakeSWCanvasSurface(64, 64)
  if (!surface) throw new Error('MakeSWCanvasSurface returned null')

  const canvas = e.Surface_getCanvas(surface)
  if (!canvas) throw new Error('Surface_getCanvas returned null')

  const paint = e.MakePaint()
  e.Paint_setAntiAlias(paint, 1)
  e.Paint_setColor(paint, 0xffff0000)

  e.Canvas_clear(canvas, 0xffffffff)
  e.Canvas_drawRect(canvas, 1, 2, 11, 12, paint)
  e.Canvas_drawCircle(canvas, 32, 32, 10, paint)

  e.Surface_flush(surface)
  e.DeletePaint(paint)
  e.DeleteSurface(surface)

  console.log('raw smoke ok')
}

main().catch((err) => {
  console.error('raw smoke failed')
  console.error(err)
  process.exitCode = 1
})
