export class BorderRadius {
  static zero(): BorderRadius {
    return new BorderRadius(0)
  }

  constructor(public readonly radius: number) {}
}
