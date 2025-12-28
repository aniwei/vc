export abstract class Eq<T> {
  eq (other: T | null): boolean {
    throw new Error('Method not implemented.')
  }

  notEq (other: T | null): boolean {
    throw new Error('Method not implemented.')
  }
}