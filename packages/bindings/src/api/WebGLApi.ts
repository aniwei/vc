import { Api } from './Api'

export class WebGLApi extends Api {
  hasWebGL(): boolean {
    return this.hasExport('WebGL_CreateContext') && this.hasExport('WebGL_MakeContextCurrent')
  }

  createContext(selectorUtf8Ptr: number, byteLength: number, webgl2: boolean): number {
    return (
      this.invoke('WebGL_CreateContext', selectorUtf8Ptr >>> 0, byteLength | 0, webgl2 ? 1 : 0) as number
    ) | 0
  }

  makeContextCurrent(ctx: number): number {
    return (this.invoke('WebGL_MakeContextCurrent', ctx | 0) as number) | 0
  }

  destroyContext(ctx: number): number {
    return (this.invoke('WebGL_DestroyContext', ctx | 0) as number) | 0
  }

  makeOnScreenSurface(w: number, h: number): number {
    return ((this.invoke('MakeOnScreenCanvasSurface', w | 0, h | 0) as number) ?? 0) >>> 0
  }
}
