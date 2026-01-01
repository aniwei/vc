import invariant from 'invariant'

declare class FinalizationRegistry<T = unknown> {
  constructor(cleanupCallback: (heldValue: T) => void)
  register(target: object, heldValue: T, unregisterToken?: object): void
  unregister(unregisterToken: object): void
}

abstract class Raw<T extends Raw<T>> {
  abstract clone (): T
  abstract delete (): void
  abstract deleteLater (): void
  abstract isAliasOf (other: any): boolean
  abstract isDeleted (): boolean
}

abstract class Eq<T extends Eq<T>> {
  abstract eq (ptr: T | null): boolean
  abstract notEq (ptr: T | null): boolean
}

export abstract class Ptr extends Raw<Ptr> {
  #ptr: number

  get raw (): number {
    return this.#ptr
  }

  set raw (ptr: number) {
    this.#ptr = ptr
  }

  constructor (ptr?: number) {
    super()
    this.#ptr = ptr ?? -1
  }
}

export class ManagedObjRegistry {
  static #registry: FinalizationRegistry<Ptr> | null = null
  static #ptrs: Ptr[] = []

  static add (obj: object, ptr: Ptr) {
    this.#registry = this.#registry ?? new FinalizationRegistry((ptr) => {
      this.cleanUp(ptr)
    })

    this.#registry.register(obj, ptr)
  }

  static remove (obj: object) {
    this.#registry?.unregister(obj)
  }

  static cleanUp (ptr: Ptr) {
    if (!ptr.isDeleted()) {
      invariant(!ptr.isDeleted(), 'Attempted to delete an already deleted Skia object.')
      this.#ptrs.push(ptr)

      requestIdleCallback(() => {
        while (true) {
          const ptr = this.#ptrs.pop() ?? null
          if (ptr !== null) {
            if (ptr.isDeleted()) {
              ptr.delete()
            }
          } else {
            break
          }
        }
      })
    }
  }
}

export abstract class ManagedObj extends Eq<ManagedObj> {
  get raw () {
    invariant(this.#ptr !== null, `The "ptr" cannot be null.`)
    return this.#ptr.raw
  }

  // => ptr
  get ptr () {
    invariant(this.#ptr !== null, `The "ptr" cannot be null.`)
    return this.#ptr as Ptr
  }

  set ptr (ptr: Ptr | null) {
    if (this.#ptr !== null) {
      ManagedObjRegistry.remove(this)
    }

    if (ptr !== null) {
      ManagedObjRegistry.add(this, ptr)
    }

    this.#delete()
    this.#ptr = ptr
  }

  #ptr: Ptr | null
  #disposed: boolean = false

  constructor (ptr?: Ptr) {
    super()
    this.#ptr = ptr ?? this.resurrect() ?? null
  }

  abstract resurrect (): Ptr

  eq (obj: ManagedObj | null) {
    return obj?.ptr === this.ptr
  }

  notEq (obj: ManagedObj | null) {
    return !this.eq(obj)
  }

  #isDeleted (): boolean {
    invariant(this.ptr !== null, `The "ptr" cannot be null.`)
    return this.ptr.isDeleted()
  }
  
  #delete () {
    this.#ptr?.delete()
    this.#ptr = null
  }

  isDisposed (): boolean {
    return this.#disposed
  }

  dispose () {
    this.#delete()
    this.#disposed = true
  }
}

//// => SkiaRefBox
// 引用计数箱子
export class ShareManagedObj<R, T extends Ptr = Ptr> {
  #ptr: T | null = null 
  public get ptr (): T {
    return this.#ptr as T
  }
  public set ptr (ptr: T | null) {
    this.#ptr = ptr
  }

  // 引用计数
  #count: number = 0
  #referrers: Set<R> = new Set()
  #isDeletedPermanently = false
  
  // disposed
  protected disposed: boolean = false

  constructor (ptr: T) {
    this.ptr = ptr
    ManagedObjRegistry.add(this, ptr)
  }
  
  retain (referrer: R) {
    invariant(!this.#referrers.has(referrer), `Attempted to increment ref count by the same referrer more than once.`)    
    
    this.#referrers.add(referrer)
    this.#count += 1
    invariant(this.#count === this.#referrers.size, 'Ref count mismatch')

    return this
  }

  /**
   * 解引用
   * @param {R} referrer 
   */
  release (referrer: R) {
    invariant(!this.#isDeletedPermanently, `Attempted to unref an already deleted Skia object.`)
    invariant(this.#referrers.delete(referrer), `Attempted to decrement ref count by the same referrer more than once.`)

    this.#count -= 1
    invariant(this.#count === this.#referrers.size, 'Ref count mismatch')

    if (this.#count === 0) {
      this.delete()
      this.#isDeletedPermanently = true
    }
  }

  /**
   * 释放引用对象
   */
  delete () {
    if (this.#count > 0) {
      console.warn('Warning: Deleting a ShareManagedObj that still has referrers.')
    }

    this.#ptr?.delete()
    this.#ptr = null
  }

  dispose () {
    if (this.#count > 0) {
      console.warn('Warning: Disposing a ShareManagedObj that still has referrers.')
    }

    this.delete()
    this.disposed = true
  }
}
