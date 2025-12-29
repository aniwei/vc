//// => type
// 类型判断
export const isTypeOf = <T>(object: T, type: string) => {
  return Object.prototype.toString.call(object) === `[object ${type}]`
}

export const isDarwin = () => {
  const p = (globalThis as any).process as { platform?: string } | undefined
  return p?.platform === 'darwin'
}

export const isLinux = () => {
  const p = (globalThis as any).process as { platform?: string } | undefined
  return p?.platform === 'linux'
}

export const isWindow = () => {
  const p = (globalThis as any).process as { platform?: string } | undefined
  return p?.platform === 'win32'
}

export const isArm64 = () => {
  const p = (globalThis as any).process as { arch?: string } | undefined
  return p?.arch === 'arm64'
}

export const isSupportBlob = () => {
  return typeof globalThis.Blob !== 'undefined'
}

export const isBlob = (blob: Blob) => {
  return isTypeOf(blob, 'Blob')
}

export const isRegExp = (r: RegExp) => {
  return isTypeOf(r, 'RegExp')
}

export const isSupportSharedArrayBuffer = () => {
  return typeof globalThis.SharedArrayBuffer !== 'undefined'
}

export const isNative = (Constructor: unknown): boolean => {
  return typeof Constructor === 'function' && /native code/.test(Constructor.toString())
}

export const isArray = <T>(object: T) => {
  return isTypeOf(object, 'Array')
}

export const isObject = (object: object) => {
  return isTypeOf(object, 'Object')
} 

