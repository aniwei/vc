export class Alignment {
  static readonly topLeft = new Alignment(-1, -1)
  static readonly topCenter = new Alignment(0, -1)
  static readonly topRight = new Alignment(1, -1)

  static readonly centerLeft = new Alignment(-1, 0)
  static readonly center = new Alignment(0, 0)
  static readonly centerRight = new Alignment(1, 0)

  static readonly bottomLeft = new Alignment(-1, 1)
  static readonly bottomCenter = new Alignment(0, 1)
  static readonly bottomRight = new Alignment(1, 1)

  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}
}
