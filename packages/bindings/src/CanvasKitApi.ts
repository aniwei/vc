
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

async function makeWasmApi(input: string): Promise<CanvasKit> {
  const wasmApi = new WasmApi()
  await wasmApi.run(input, {}, 0)

  const api = wasmApi as unknown as CanvasKit

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

  return await makeWasmApi(input)
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

  // MDN DataView-style helpers (preferred)
  static getUint8(byteOffset: Ptr): number {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.getUint8(byteOffset)
  }

  static setUint8(byteOffset: Ptr, value: number): void {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    this.#api.setUint8(byteOffset, value)
  }

  static getUint32(byteOffset: Ptr, littleEndian: boolean = true): number {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.getUint32(byteOffset, littleEndian)
  }

  static setUint32(byteOffset: Ptr, value: number, littleEndian: boolean = true): void {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    this.#api.setUint32(byteOffset, value, littleEndian)
  }

  static getFloat32(byteOffset: Ptr, littleEndian: boolean = true): number {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.getFloat32(byteOffset, littleEndian)
  }

  static setFloat32(byteOffset: Ptr, value: number, littleEndian: boolean = true): void {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    this.#api.setFloat32(byteOffset, value, littleEndian)
  }

  static getBytes(byteOffset: Ptr, length: number): Uint8Array {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.getBytes(byteOffset, length)
  }

  static setBytes(byteOffset: Ptr, bytes: ArrayLike<number> | Uint8Array): void {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    this.#api.setBytes(byteOffset, bytes)
  }

  static getUint32Array(byteOffset: Ptr, length: number): Uint32Array {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.getUint32Array(byteOffset, length)
  }

  static setUint32Array(byteOffset: Ptr, values: ArrayLike<number> | Uint32Array): void {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    this.#api.setUint32Array(byteOffset, values)
  }

  static getFloat32Array(byteOffset: Ptr, length: number): Float32Array {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.getFloat32Array(byteOffset, length)
  }

  static setFloat32Array(byteOffset: Ptr, values: ArrayLike<number> | Float32Array): void {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    this.#api.setFloat32Array(byteOffset, values)
  }

  static allocBytes(bytes: ArrayLike<number> | Uint8Array): Ptr {
    invariant(this.#api !== null, 'CanvasKitApi not initialized. Call CanvasKitApi.ready() first.')
    return this.#api.allocBytes(bytes)
  }
}