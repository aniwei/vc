export class InvariantError extends Error {
  constructor(message?: string | number) {
    super(message == null ? 'Invariant failed' : String(message))
    this.name = 'InvariantError'
  }
}

export function invariant(
  condition: any,
  message?: string | number,
): asserts condition {
  const ok = typeof condition === 'function' ? !!condition() : !!condition
  if (!ok) {
    throw new InvariantError(message)
  }
}