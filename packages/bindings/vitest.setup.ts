// Vitest runs in Node for this package.
// Some runtime code assumes a browser-like requestIdleCallback exists.

type IdleDeadline = {
  didTimeout: boolean
  timeRemaining(): number
}

if (typeof (globalThis as any).requestIdleCallback !== 'function') {
  ;(globalThis as any).requestIdleCallback = (cb: (deadline: IdleDeadline) => void) => {
    return setTimeout(() => {
      cb({ didTimeout: false, timeRemaining: () => 50 })
    }, 0) as unknown as number
  }
}

if (typeof (globalThis as any).cancelIdleCallback !== 'function') {
  ;(globalThis as any).cancelIdleCallback = (id: number) => {
    clearTimeout(id as any)
  }
}
