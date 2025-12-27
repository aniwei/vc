export enum BorderStyle {
  None = 'none',
  Solid = 'solid',
}

export class BorderSide {
  static readonly NONE = new BorderSide(0, BorderStyle.None)

  constructor(
    public readonly width: number = 1,
    public readonly style: BorderStyle = BorderStyle.Solid,
  ) {}
}
