export class Shadow {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly blur: number,
    public readonly spread: number = 0,
  ) {}
}

export type ShapeShadow = Shadow
export type ShapeShadows = Shadow[]
