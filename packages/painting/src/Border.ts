export enum BorderStyle {
  None = 'none',
  Solid = 'solid',
}

export class BorderSide {
  static readonly NONE = new BorderSide(0, BorderStyle.None)

  constructor(
    public readonly width: number = 1,
    public readonly style: BorderStyle = BorderStyle.Solid,
    // ARGB color, e.g. 0xff000000 for opaque black
    public readonly color: number = 0xff000000,
  ) {}
}
