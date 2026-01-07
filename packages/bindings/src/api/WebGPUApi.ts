import { Api } from './Api'

export class WebGPUApi extends Api {
  hasWebGPU(): boolean {
    return this.hasExport('MakeGPUTextureSurface')
  }

  makeGPUTextureSurface(textureHandle: number, textureFormat: number, width: number, height: number): number {
    return (
      (this.invoke(
        'MakeGPUTextureSurface',
        textureHandle >>> 0,
        textureFormat >>> 0,
        width | 0,
        height | 0,
      ) as number) ?? 0
    ) >>> 0
  }
}
