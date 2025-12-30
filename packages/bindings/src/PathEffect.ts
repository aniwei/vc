import invariant from 'invariant'

import { ManagedObj, ManagedObjRegistry, Ptr } from './ManagedObj'
import { CanvasKitApi } from './CanvasKitApi'

class PathEffectPtr extends Ptr {
  constructor(ptr?: number) {
    super(ptr ?? -1)
  }

  delete(): void {
    if (!this.isDeleted()) {
      CanvasKitApi.PathEffect.delete(this.raw)
      this.raw = -1
    }
  }

  deleteLater(): void {
    ManagedObjRegistry.cleanUp(this)
  }

  clone(): PathEffectPtr {
    return new PathEffectPtr(this.raw)
  }

  isAliasOf(other: any): boolean {
    return other instanceof PathEffectPtr && this.raw === other.raw
  }

  isDeleted(): boolean {
    return this.raw === -1
  }
}

export class PathEffect extends ManagedObj {
  static makeDash(intervals: number[], phase: number = 0): PathEffect {
    invariant(intervals.length > 0, 'Expected non-empty dash intervals')

    const count = intervals.length | 0
    const bytes = count * 4
    const intervalsPtr = CanvasKitApi.malloc(bytes) as number

    try {
      CanvasKitApi.setFloat32Array(intervalsPtr >>> 0, intervals)
      const pePtr = CanvasKitApi.PathEffect.makeDash(intervalsPtr >>> 0, count, phase) as number
      return new PathEffect(new PathEffectPtr(pePtr))
    } finally {
      CanvasKitApi.free(intervalsPtr >>> 0)
    }
  }

  constructor(ptr: PathEffectPtr) {
    super(ptr)
  }

  get ptr(): PathEffectPtr {
    return super.ptr as PathEffectPtr
  }

  resurrect(): Ptr {
    throw new Error('PathEffect cannot be resurrected')
  }

  dispose(): void {
    this.ptr.deleteLater()
    super.dispose()
  }
}
