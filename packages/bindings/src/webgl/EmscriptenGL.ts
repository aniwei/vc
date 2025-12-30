export type WebGLContextLike = any

function assert(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

// Minimal WebGL shim for CanvasKit cheap/no-glue builds.
//
// The wasm imports `emscripten_gl*` as function pointers (GOT.func globals).
// We provide a pragmatic subset used by Skia Ganesh; unimplemented symbols
// safely return 0.
export class EmscriptenGL {
  #gl: WebGLContextLike
  #u8: () => Uint8Array
  #malloc: (n: number) => number
  #setBytes: (ptr: number, bytes: Uint8Array) => void

  #buffers: any[] = [null]
  #textures: any[] = [null]
  #framebuffers: any[] = [null]
  #renderbuffers: any[] = [null]
  #programs: any[] = [null]
  #shaders: any[] = [null]
  #vaos: any[] = [null]
  #uniformLocations: any[] = [null]

  #getStringPtr: Map<number, number> = new Map()

  constructor(opts: {
    gl: WebGLContextLike
    heapU8: () => Uint8Array
    malloc: (n: number) => number
    setBytes: (ptr: number, bytes: Uint8Array) => void
  }) {
    assert(opts.gl, 'WebGL context is required')
    this.#gl = opts.gl
    this.#u8 = opts.heapU8
    this.#malloc = opts.malloc
    this.#setBytes = opts.setBytes
  }

  unimplemented(_name: string): (...args: any[]) => any {
    return function stubbedEmscriptenGL() {
      return 0
    }
  }

  get gl(): WebGLContextLike {
    return this.#gl
  }

  #bytes(ptr: number, len: number): Uint8Array {
    return this.#u8().subarray(ptr >>> 0, ((ptr >>> 0) + (len >>> 0)) >>> 0)
  }

  #dv(): DataView {
    return new DataView(this.#u8().buffer)
  }

  #readU32(ptr: number): number {
    return this.#dv().getUint32(ptr >>> 0, true) >>> 0
  }

  #readI32(ptr: number): number {
    return this.#dv().getInt32(ptr >>> 0, true) | 0
  }

  #writeU32(ptr: number, v: number): void {
    this.#dv().setUint32(ptr >>> 0, v >>> 0, true)
  }

  #writeI32(ptr: number, v: number): void {
    this.#dv().setInt32(ptr >>> 0, v | 0, true)
  }

  #readCString(ptr: number): string {
    const heap = this.#u8()
    let end = ptr >>> 0
    while (end < heap.length && heap[end] !== 0) end++
    return new TextDecoder('utf-8').decode(heap.subarray(ptr >>> 0, end))
  }

  #allocCString(s: string): number {
    const bytes = new TextEncoder().encode(s)
    const ptr = this.#malloc(bytes.length + 1) >>> 0
    this.#setBytes(ptr, bytes)
    this.#u8()[ptr + bytes.length] = 0
    return ptr
  }

  #allocHandle(table: any[], obj: any): number {
    const id = table.length
    table.push(obj)
    return id
  }

  #getHandle<T = any>(table: any[], id: number): T | null {
    return (table[id >>> 0] as T) ?? null
  }

  #deleteHandle(table: any[], id: number): void {
    if ((id >>> 0) === 0) return
    table[id >>> 0] = null
  }

  glGetString(name: number): number {
    if (this.#getStringPtr.has(name >>> 0)) return this.#getStringPtr.get(name >>> 0)!

    let out = ''
    try {
      const v = this.#gl.getParameter(name >>> 0)
      out = typeof v === 'string' ? v : String(v ?? '')
    } catch {
      out = ''
    }

    const ptr = this.#allocCString(out)
    this.#getStringPtr.set(name >>> 0, ptr)
    return ptr
  }

  // --- Core subset ---
  emscripten_glGetError(): number {
    return this.#gl.getError() | 0
  }

  emscripten_glViewport(x: number, y: number, w: number, h: number): void {
    this.#gl.viewport(x | 0, y | 0, w | 0, h | 0)
  }

  emscripten_glScissor(x: number, y: number, w: number, h: number): void {
    this.#gl.scissor(x | 0, y | 0, w | 0, h | 0)
  }

  emscripten_glClearColor(r: number, g: number, b: number, a: number): void {
    this.#gl.clearColor(+r, +g, +b, +a)
  }

  emscripten_glClear(mask: number): void {
    this.#gl.clear(mask >>> 0)
  }

  emscripten_glEnable(cap: number): void {
    this.#gl.enable(cap >>> 0)
  }

  emscripten_glDisable(cap: number): void {
    this.#gl.disable(cap >>> 0)
  }

  emscripten_glColorMask(r: number, g: number, b: number, a: number): void {
    this.#gl.colorMask(!!r, !!g, !!b, !!a)
  }

  emscripten_glDepthMask(flag: number): void {
    this.#gl.depthMask(!!flag)
  }

  emscripten_glBlendFunc(sfactor: number, dfactor: number): void {
    this.#gl.blendFunc(sfactor >>> 0, dfactor >>> 0)
  }

  emscripten_glBlendEquation(mode: number): void {
    this.#gl.blendEquation(mode >>> 0)
  }

  emscripten_glBlendColor(r: number, g: number, b: number, a: number): void {
    this.#gl.blendColor(+r, +g, +b, +a)
  }

  emscripten_glActiveTexture(texture: number): void {
    this.#gl.activeTexture(texture >>> 0)
  }

  // Buffers
  emscripten_glGenBuffers(n: number, buffersPtr: number): void {
    for (let i = 0; i < (n | 0); i++) {
      const buf = this.#gl.createBuffer()
      const id = this.#allocHandle(this.#buffers, buf)
      this.#writeU32((buffersPtr + i * 4) >>> 0, id)
    }
  }

  emscripten_glDeleteBuffers(n: number, buffersPtr: number): void {
    for (let i = 0; i < (n | 0); i++) {
      const id = this.#readU32((buffersPtr + i * 4) >>> 0)
      const obj = this.#getHandle(this.#buffers, id)
      if (obj) this.#gl.deleteBuffer(obj)
      this.#deleteHandle(this.#buffers, id)
    }
  }

  emscripten_glBindBuffer(target: number, buffer: number): void {
    this.#gl.bindBuffer(target >>> 0, this.#getHandle(this.#buffers, buffer))
  }

  emscripten_glBufferData(target: number, size: number, dataPtr: number, usage: number): void {
    if ((dataPtr >>> 0) === 0) {
      this.#gl.bufferData(target >>> 0, size >>> 0, usage >>> 0)
      return
    }
    this.#gl.bufferData(target >>> 0, this.#bytes(dataPtr >>> 0, size >>> 0), usage >>> 0)
  }

  emscripten_glBufferSubData(target: number, offset: number, size: number, dataPtr: number): void {
    this.#gl.bufferSubData(target >>> 0, offset >>> 0, this.#bytes(dataPtr >>> 0, size >>> 0))
  }

  // Textures
  emscripten_glGenTextures(n: number, texturesPtr: number): void {
    for (let i = 0; i < (n | 0); i++) {
      const tex = this.#gl.createTexture()
      const id = this.#allocHandle(this.#textures, tex)
      this.#writeU32((texturesPtr + i * 4) >>> 0, id)
    }
  }

  emscripten_glDeleteTextures(n: number, texturesPtr: number): void {
    for (let i = 0; i < (n | 0); i++) {
      const id = this.#readU32((texturesPtr + i * 4) >>> 0)
      const obj = this.#getHandle(this.#textures, id)
      if (obj) this.#gl.deleteTexture(obj)
      this.#deleteHandle(this.#textures, id)
    }
  }

  emscripten_glBindTexture(target: number, texture: number): void {
    this.#gl.bindTexture(target >>> 0, this.#getHandle(this.#textures, texture))
  }

  emscripten_glTexParameteri(target: number, pname: number, param: number): void {
    this.#gl.texParameteri(target >>> 0, pname >>> 0, param | 0)
  }

  emscripten_glPixelStorei(pname: number, param: number): void {
    this.#gl.pixelStorei(pname >>> 0, param | 0)
  }

  emscripten_glTexImage2D(
    target: number,
    level: number,
    internalFormat: number,
    width: number,
    height: number,
    border: number,
    format: number,
    type: number,
    pixelsPtr: number,
  ): void {
    if ((pixelsPtr >>> 0) === 0) {
      this.#gl.texImage2D(target >>> 0, level | 0, internalFormat | 0, width | 0, height | 0, border | 0, format >>> 0, type >>> 0, null)
      return
    }
    const byteLen = (width | 0) * (height | 0) * 4
    this.#gl.texImage2D(
      target >>> 0,
      level | 0,
      internalFormat | 0,
      width | 0,
      height | 0,
      border | 0,
      format >>> 0,
      type >>> 0,
      this.#bytes(pixelsPtr >>> 0, byteLen >>> 0),
    )
  }

  emscripten_glTexSubImage2D(
    target: number,
    level: number,
    xoffset: number,
    yoffset: number,
    width: number,
    height: number,
    format: number,
    type: number,
    pixelsPtr: number,
  ): void {
    const byteLen = (width | 0) * (height | 0) * 4
    this.#gl.texSubImage2D(
      target >>> 0,
      level | 0,
      xoffset | 0,
      yoffset | 0,
      width | 0,
      height | 0,
      format >>> 0,
      type >>> 0,
      this.#bytes(pixelsPtr >>> 0, byteLen >>> 0),
    )
  }

  // Framebuffers / Renderbuffers
  emscripten_glGenFramebuffers(n: number, framebuffersPtr: number): void {
    for (let i = 0; i < (n | 0); i++) {
      const fb = this.#gl.createFramebuffer()
      const id = this.#allocHandle(this.#framebuffers, fb)
      this.#writeU32((framebuffersPtr + i * 4) >>> 0, id)
    }
  }

  emscripten_glDeleteFramebuffers(n: number, framebuffersPtr: number): void {
    for (let i = 0; i < (n | 0); i++) {
      const id = this.#readU32((framebuffersPtr + i * 4) >>> 0)
      const obj = this.#getHandle(this.#framebuffers, id)
      if (obj) this.#gl.deleteFramebuffer(obj)
      this.#deleteHandle(this.#framebuffers, id)
    }
  }

  emscripten_glBindFramebuffer(target: number, framebuffer: number): void {
    this.#gl.bindFramebuffer(target >>> 0, this.#getHandle(this.#framebuffers, framebuffer))
  }

  emscripten_glGenRenderbuffers(n: number, renderbuffersPtr: number): void {
    for (let i = 0; i < (n | 0); i++) {
      const rb = this.#gl.createRenderbuffer()
      const id = this.#allocHandle(this.#renderbuffers, rb)
      this.#writeU32((renderbuffersPtr + i * 4) >>> 0, id)
    }
  }

  emscripten_glDeleteRenderbuffers(n: number, renderbuffersPtr: number): void {
    for (let i = 0; i < (n | 0); i++) {
      const id = this.#readU32((renderbuffersPtr + i * 4) >>> 0)
      const obj = this.#getHandle(this.#renderbuffers, id)
      if (obj) this.#gl.deleteRenderbuffer(obj)
      this.#deleteHandle(this.#renderbuffers, id)
    }
  }

  emscripten_glBindRenderbuffer(target: number, renderbuffer: number): void {
    this.#gl.bindRenderbuffer(target >>> 0, this.#getHandle(this.#renderbuffers, renderbuffer))
  }

  emscripten_glFramebufferTexture2D(target: number, attachment: number, textarget: number, texture: number, level: number): void {
    this.#gl.framebufferTexture2D(
      target >>> 0,
      attachment >>> 0,
      textarget >>> 0,
      this.#getHandle(this.#textures, texture),
      level | 0,
    )
  }

  emscripten_glFramebufferRenderbuffer(target: number, attachment: number, renderbuffertarget: number, renderbuffer: number): void {
    this.#gl.framebufferRenderbuffer(
      target >>> 0,
      attachment >>> 0,
      renderbuffertarget >>> 0,
      this.#getHandle(this.#renderbuffers, renderbuffer),
    )
  }

  emscripten_glCheckFramebufferStatus(target: number): number {
    return this.#gl.checkFramebufferStatus(target >>> 0) >>> 0
  }

  // Shaders / Programs
  emscripten_glCreateShader(type: number): number {
    return this.#allocHandle(this.#shaders, this.#gl.createShader(type >>> 0))
  }

  emscripten_glDeleteShader(shader: number): void {
    const s = this.#getHandle(this.#shaders, shader)
    if (s) this.#gl.deleteShader(s)
    this.#deleteHandle(this.#shaders, shader)
  }

  emscripten_glShaderSource(shader: number, count: number, stringPtr: number, lengthPtr: number): void {
    const sh = this.#getHandle(this.#shaders, shader)
    if (!sh) return

    let src = ''
    for (let i = 0; i < (count | 0); i++) {
      const pStr = this.#readU32((stringPtr + i * 4) >>> 0)
      if ((lengthPtr >>> 0) === 0) {
        src += this.#readCString(pStr)
      } else {
        const len = this.#readI32((lengthPtr + i * 4) >>> 0)
        src += len < 0 ? this.#readCString(pStr) : new TextDecoder('utf-8').decode(this.#bytes(pStr, len))
      }
    }
    this.#gl.shaderSource(sh, src)
  }

  emscripten_glCompileShader(shader: number): void {
    const sh = this.#getHandle(this.#shaders, shader)
    if (sh) this.#gl.compileShader(sh)
  }

  emscripten_glGetShaderiv(shader: number, pname: number, paramsPtr: number): void {
    const sh = this.#getHandle(this.#shaders, shader)
    const v = sh ? this.#gl.getShaderParameter(sh, pname >>> 0) : 0
    this.#writeI32(paramsPtr >>> 0, typeof v === 'boolean' ? (v ? 1 : 0) : (v | 0))
  }

  emscripten_glGetShaderInfoLog(shader: number, bufSize: number, lengthPtr: number, infoLogPtr: number): void {
    const sh = this.#getHandle(this.#shaders, shader)
    const log = sh ? (this.#gl.getShaderInfoLog(sh) || '') : ''
    const bytes = new TextEncoder().encode(log)
    const n = Math.max(0, Math.min(bytes.length, (bufSize | 0) - 1))

    if ((infoLogPtr >>> 0) !== 0 && n > 0) {
      this.#setBytes(infoLogPtr >>> 0, bytes.subarray(0, n))
      this.#u8()[(infoLogPtr + n) >>> 0] = 0
    }
    if ((lengthPtr >>> 0) !== 0) this.#writeI32(lengthPtr >>> 0, n)
  }

  emscripten_glCreateProgram(): number {
    return this.#allocHandle(this.#programs, this.#gl.createProgram())
  }

  emscripten_glDeleteProgram(program: number): void {
    const p = this.#getHandle(this.#programs, program)
    if (p) this.#gl.deleteProgram(p)
    this.#deleteHandle(this.#programs, program)
  }

  emscripten_glAttachShader(program: number, shader: number): void {
    const p = this.#getHandle(this.#programs, program)
    const s = this.#getHandle(this.#shaders, shader)
    if (p && s) this.#gl.attachShader(p, s)
  }

  emscripten_glBindAttribLocation(program: number, index: number, namePtr: number): void {
    const p = this.#getHandle(this.#programs, program)
    if (!p) return
    this.#gl.bindAttribLocation(p, index >>> 0, this.#readCString(namePtr >>> 0))
  }

  emscripten_glLinkProgram(program: number): void {
    const p = this.#getHandle(this.#programs, program)
    if (p) this.#gl.linkProgram(p)
  }

  emscripten_glUseProgram(program: number): void {
    this.#gl.useProgram(this.#getHandle(this.#programs, program))
  }

  emscripten_glGetProgramiv(program: number, pname: number, paramsPtr: number): void {
    const p = this.#getHandle(this.#programs, program)
    const v = p ? this.#gl.getProgramParameter(p, pname >>> 0) : 0
    this.#writeI32(paramsPtr >>> 0, typeof v === 'boolean' ? (v ? 1 : 0) : (v | 0))
  }

  emscripten_glGetProgramInfoLog(program: number, bufSize: number, lengthPtr: number, infoLogPtr: number): void {
    const p = this.#getHandle(this.#programs, program)
    const log = p ? (this.#gl.getProgramInfoLog(p) || '') : ''
    const bytes = new TextEncoder().encode(log)
    const n = Math.max(0, Math.min(bytes.length, (bufSize | 0) - 1))

    if ((infoLogPtr >>> 0) !== 0 && n > 0) {
      this.#setBytes(infoLogPtr >>> 0, bytes.subarray(0, n))
      this.#u8()[(infoLogPtr + n) >>> 0] = 0
    }
    if ((lengthPtr >>> 0) !== 0) this.#writeI32(lengthPtr >>> 0, n)
  }

  emscripten_glGetAttribLocation(program: number, namePtr: number): number {
    const p = this.#getHandle(this.#programs, program)
    if (!p) return -1
    return this.#gl.getAttribLocation(p, this.#readCString(namePtr >>> 0)) | 0
  }

  emscripten_glGetUniformLocation(program: number, namePtr: number): number {
    const p = this.#getHandle(this.#programs, program)
    if (!p) return 0
    const loc = this.#gl.getUniformLocation(p, this.#readCString(namePtr >>> 0))
    return this.#allocHandle(this.#uniformLocations, loc)
  }

  #loc(id: number): any {
    return this.#getHandle(this.#uniformLocations, id)
  }

  emscripten_glUniform1f(location: number, v0: number): void {
    this.#gl.uniform1f(this.#loc(location), +v0)
  }

  emscripten_glUniform1i(location: number, v0: number): void {
    this.#gl.uniform1i(this.#loc(location), v0 | 0)
  }

  emscripten_glUniformMatrix4fv(location: number, count: number, _transpose: number, valuePtr: number): void {
    const n = (count | 0) * 16
    const f32 = new Float32Array(this.#u8().buffer, valuePtr >>> 0, n)
    this.#gl.uniformMatrix4fv(this.#loc(location), false, f32)
  }

  emscripten_glEnableVertexAttribArray(index: number): void {
    this.#gl.enableVertexAttribArray(index >>> 0)
  }

  emscripten_glDisableVertexAttribArray(index: number): void {
    this.#gl.disableVertexAttribArray(index >>> 0)
  }

  emscripten_glVertexAttribPointer(index: number, size: number, type: number, normalized: number, stride: number, pointer: number): void {
    this.#gl.vertexAttribPointer(index >>> 0, size | 0, type >>> 0, !!normalized, stride | 0, pointer >>> 0)
  }

  emscripten_glDrawArrays(mode: number, first: number, count: number): void {
    this.#gl.drawArrays(mode >>> 0, first | 0, count | 0)
  }

  emscripten_glDrawElements(mode: number, count: number, type: number, indices: number): void {
    this.#gl.drawElements(mode >>> 0, count | 0, type >>> 0, indices >>> 0)
  }

  emscripten_glReadPixels(x: number, y: number, w: number, h: number, format: number, type: number, pixelsPtr: number): void {
    const byteLen = (w | 0) * (h | 0) * 4
    this.#gl.readPixels(x | 0, y | 0, w | 0, h | 0, format >>> 0, type >>> 0, this.#bytes(pixelsPtr >>> 0, byteLen >>> 0))
  }

  // VAO (WebGL2)
  emscripten_glGenVertexArrays(n: number, arraysPtr: number): void {
    for (let i = 0; i < (n | 0); i++) {
      const vao = this.#gl.createVertexArray?.() ?? null
      const id = this.#allocHandle(this.#vaos, vao)
      this.#writeU32((arraysPtr + i * 4) >>> 0, id)
    }
  }

  emscripten_glBindVertexArray(array: number): void {
    const vao = this.#getHandle(this.#vaos, array)
    if (this.#gl.bindVertexArray) this.#gl.bindVertexArray(vao)
  }

  emscripten_glDeleteVertexArrays(n: number, arraysPtr: number): void {
    for (let i = 0; i < (n | 0); i++) {
      const id = this.#readU32((arraysPtr + i * 4) >>> 0)
      const vao = this.#getHandle(this.#vaos, id)
      if (vao && this.#gl.deleteVertexArray) this.#gl.deleteVertexArray(vao)
      this.#deleteHandle(this.#vaos, id)
    }
  }
}
