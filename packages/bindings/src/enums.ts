export enum PathFillType {
  Winding = 0,
  EvenOdd = 1,
  InverseWinding = 2,
  InverseEvenOdd = 3,
}

export enum PaintStyle {
  Fill = 0,
  Stroke = 1,
  StrokeAndFill = 2,
}

export enum FilterMode {
  Nearest = 0,
  Linear = 1,
}

export enum MipmapMode {
  None = 0,
  Nearest = 1,
  Linear = 2,
}

export enum TileMode {
  Clamp = 0,
  Repeat = 1,
  Mirror = 2,
  Decal = 3,
}

export enum ClipOp {
  Difference = 0,
  Intersect = 1,
}

export enum Clip {
  None = 0,
  HardEdge = 1,
  AntiAlias = 2,
  AntiAliasWithSaveLayer = 3,
}

export enum TextDirection {
  LTR = 1,
  RTL = 0,
}

export enum TextAlign {
  Left = 0,
  Right = 1,
  Center = 2,
  Justify = 3,
  Start = 4,
  End = 5,
}