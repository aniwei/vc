export type LTRBRect = readonly [number, number, number, number]

export interface CanvasLike {
  save(): void
  restore(): void
  clipRect(rect: LTRBRect, op?: unknown, doAA?: boolean): void
  translate(dx: number, dy: number): void
  scale(sx: number, sy: number): void

  drawImageRect(image: unknown, src: LTRBRect, dst: LTRBRect, paint?: unknown): void
  drawImageNine?(image: unknown, center: LTRBRect, dst: LTRBRect, paint?: unknown): void
}
