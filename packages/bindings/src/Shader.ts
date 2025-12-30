import invariant from 'invariant'

import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'

class ShaderPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.Shader.delete(this.raw)
      this.raw = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): ShaderPtr {
    return new ShaderPtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof ShaderPtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
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
      CanvasKitApi.setUint32Array(colorsPtr, colors)
      const stops = positions && positions.length === count ? positions : null
      
      if (stops) {
        CanvasKitApi.setFloat32Array(posPtr, stops)
      } else {
        // Evenly spaced defaults.
        const data = new Float32Array(count)
        if (count === 1) {
          data[0] = 0
        } else {
          for (let i = 0; i < count; i++) {
            data[i] = i / (count - 1)
          }
        }

        CanvasKitApi.setFloat32Array(posPtr, data)
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

  get ptr(): ShaderPtr {
    return super.ptr as ShaderPtr
  }

  resurrect(): Ptr {
    throw new Error('Shader cannot be resurrected')
  }

  dispose(): void {
    this.ptr.deleteLater()
    super.dispose()
  }
}
