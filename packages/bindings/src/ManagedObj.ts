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

  get ptr (): number {
    return this.#ptr
  }

  constructor (ptr?: number) {
    super()
    this.#ptr = ptr ?? -1
  }

  protected _setPtr (ptr: number): void {
    this.#ptr = ptr
  }
}

export class ManagedObjRegistry {
  static #registry: FinalizationRegistry<Ptr> | null = null
  static #ptrs: Ptr[] = []

  static add (obj: ManagedObj, ptr: Ptr) {
    this.#registry = this.#registry ?? new FinalizationRegistry((ptr) => {
      this.cleanUp(ptr)
    })

    this.#registry.register(obj, ptr)
  }

  static remove (ptr: ManagedObj) {
    this.#registry?.unregister(ptr)
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

    this.delete()
    this.#ptr = ptr
  }

  #ptr: Ptr | null
  #disposed: boolean = false

  constructor (ptr?: Ptr) {
    super()
    this.#ptr = ptr ?? this.resurrect() ?? null
  }

  resurrect (): Ptr {
    throw new Error('The "resurrect" method is not implemented.')
  }

  eq (obj: ManagedObj | null) {
    return obj?.ptr === this.ptr
  }

  notEq (obj: ManagedObj | null) {
    return !this.eq(obj)
  }

  isDeleted (): boolean {
    invariant(this.ptr !== null, `The "ptr" cannot be null.`)
    return this.ptr.isDeleted()
  }
  
  delete () {
    this.#ptr?.delete()
    this.#ptr = null
  }

  dispose () {
    this.delete()
    this.#disposed = true
  }
}