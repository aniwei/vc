import invariant from 'invariant'

import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'

function writeU32Array(ptr: number, values: ArrayLike<number>): void {
  const heap = CanvasKitApi.heapU8()
  const u32 = new Uint32Array(heap.buffer)
  const off = (ptr >>> 0) >>> 2
  for (let i = 0; i < values.length; i++) {
    u32[off + i] = (values[i]! >>> 0) as any
  }
}

function writeF32Array(ptr: number, values: ArrayLike<number>): void {
  const heap = CanvasKitApi.heapU8()
  const f32 = new Float32Array(heap.buffer)
  const off = (ptr >>> 0) >>> 2
  for (let i = 0; i < values.length; i++) {
    f32[off + i] = +values[i]!
  }
}

class ShaderPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Shader.delete(this.ptr)
      this.ptr = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): ShaderPtr {
    return new ShaderPtr(this.ptr)
  }

  isAliasOf(other: any): boolean {
    return other instanceof ShaderPtr && this.ptr === other.ptr
  }

  isDeleted(): boolean {
    return this.ptr === -1
  }
}

export class Shader extends ManagedObj {
  // NOTE: tileMode is an int matching SkTileMode. We currently default to Clamp (0).
  static makeColor(argb: number): Shader {
    const ptr = CanvasKitApi.Shader.makeColor(argb >>> 0) as number
    return new Shader(new ShaderPtr(ptr))
  }

  static makeLinearGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    colors: number[],
    positions?: number[] | null,
    tileMode: number = 0,
  ): Shader {
    invariant(colors.length >= 2, `Expected >=2 colors, got ${colors.length}`)

    const count = colors.length | 0
    const colorsPtr = CanvasKitApi.malloc(count * 4) as number
    const posPtr = CanvasKitApi.malloc(count * 4) as number

    try {
      writeU32Array(colorsPtr, colors)

      const stops = positions && positions.length === count ? positions : null
      if (stops) {
        writeF32Array(posPtr, stops)
      } else {
        // Evenly spaced defaults.
        const tmp = new Float32Array(count)
        if (count === 1) tmp[0] = 0
        else {
          for (let i = 0; i < count; i++) tmp[i] = i / (count - 1)
        }
        writeF32Array(posPtr, tmp)
      }

      const shaderPtr = CanvasKitApi.Shader.makeLinearGradient(
        x0,
        y0,
        x1,
        y1,
        colorsPtr >>> 0,
        posPtr >>> 0,
        count,
        tileMode,
      ) as number

      return new Shader(new ShaderPtr(shaderPtr))
    } finally {
      CanvasKitApi.free(colorsPtr >>> 0)
      CanvasKitApi.free(posPtr >>> 0)
    }
  }

  constructor(ptr: ShaderPtr) {
    super(ptr)
  }

  resurrect(): Ptr {
    throw new Error('Shader cannot be resurrected')
  }

  get raw(): ShaderPtr {
    return this.ptr as unknown as ShaderPtr
  }

  dispose(): void {
    ;(this.ptr as unknown as ShaderPtr).deleteLater()
    super.dispose()
  }
}
