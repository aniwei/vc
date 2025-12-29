export class ResizeError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'ResizeError'
  }
}
