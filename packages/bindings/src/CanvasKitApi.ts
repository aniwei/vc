
import { PaintApi } from './api/PaintApi'
import { PathApi } from './api/PathApi'
import { SurfaceApi } from './api/SurfaceApi'
import { CanvasApi } from './api/CanvasApi'
import { ImageApi } from './api/ImageApi'
import { ParagraphApi } from './api/ParagraphApi'
import { ParagraphBuilderApi } from './api/ParagraphBuilderApi'
import { ShaderApi } from './api/ShaderApi'
import { PathEffectApi } from './api/PathEffectApi'

import type { Imports, Ptr } from './types'

import invariant from 'invariant'
import { WasmApi } from './WasmApi'

export type { Imports, Ptr }

export type CanvasKit = WasmApi & {
  Path: PathApi
  Paint: PaintApi
  Surface: SurfaceApi
  Canvas: CanvasApi
  Image: ImageApi
  Paragraph: ParagraphApi
  ParagraphBuilder: ParagraphBuilderApi
  Shader: ShaderApi
  PathEffect: PathEffectApi
}






async function makeWasmApi(input: string): CanvasKit {
  const wasmApi = new WasmApi()
  await wasmApi.run(input, {}, 0)

  const api = Object.create(wasmApi) as CanvasKit

  api.Path = new PathApi(wasmApi)
  api.Paint = new PaintApi(wasmApi)
  api.Surface = new SurfaceApi(wasmApi)
  api.Canvas = new CanvasApi(wasmApi)
  api.Image = new ImageApi(wasmApi)
  api.Paragraph = new ParagraphApi(wasmApi)
  api.ParagraphBuilder = new ParagraphBuilderApi(wasmApi)
  api.Shader = new ShaderApi(wasmApi)
  api.PathEffect = new PathEffectApi(wasmApi)

  return api
}


export interface CanvasKitOptions {
  uri?: string
  path?: string
  imports?: Imports
}

async function ready(options: CanvasKitOptions): Promise<CanvasKit> {
  const input = options.uri ?? options.path
  if (!input) {
    throw new Error('Expected options.uri, options.path, or options.wasmPath')
  }

  const api = makeWasmApi(input)
  return api
}

export class CanvasKitApi {
  static async ready (options: CanvasKitOptions): Promise<CanvasKit> {
    if (this.#api !== null) {
      return this.#api
    }

    const api = await ready(options)
    this.#api = api

    return api
  }
  static #api: CanvasKit | null = null

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

  static get Paragraph () {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.Paragraph
  }

  static get ParagraphBuilder () {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.ParagraphBuilder
  }

  static get Shader () {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.Shader
  }

  static get PathEffect () {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.PathEffect
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
    return this.#api.heapU8()
  }

  static heapU32(): Uint32Array {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.heapU32()
  }

  static heapF32(): Float32Array {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.heapF32()
  }

  static readBytes(ptr: Ptr, len: number): Buffer {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.readBytes(ptr, len)
  }

  static writeBytes(ptr: Ptr, buf: Uint8Array): void {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    this.#api.writeBytes(ptr, buf)
  }

  static writeU32Array(ptr: Ptr, arr: Uint32Array): void {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    this.#api.writeU32Array(ptr, arr)
  }

  static writeF32Array(ptr: Ptr, arr: Float32Array): void {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    this.#api.writeF32Array(ptr, arr)
  }

  static allocBytes(bytes: ArrayLike<number> | Uint8Array): Ptr {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.allocBytes(bytes)
  }
}