/**
 * CanvasKit Type Definitions for cheap WebAssembly Runtime
 * 
 * These types define the CanvasKit API that will be exposed through
 * the cheap WebAssembly runtime.
 */

export interface Rect {
  left: float
  top: float
  right: float
  bottom: float
}

export interface Color {
  r: float
  g: float
  b: float
  a: float
}

export type ColorInt = uint32

export interface Point {
  x: float
  y: float
}

export interface Paint {
  setColor(color: ColorInt): void
  setAntiAlias(aa: boolean): void
  setStyle(style: PaintStyle): void
  setStrokeWidth(width: float): void
  delete(): void
}

export enum PaintStyle {
  Fill = 0,
  Stroke = 1
}

export interface Path {
  moveTo(x: float, y: float): void
  lineTo(x: float, y: float): void
  close(): void
  reset(): void
  delete(): void
}

export interface Canvas {
  clear(color: ColorInt): void
  drawRect(rect: Rect, paint: Paint): void
  drawPath(path: Path, paint: Paint): void
  drawCircle(cx: float, cy: float, radius: float, paint: Paint): void
  save(): int32
  restore(): void
  translate(dx: float, dy: float): void
  scale(sx: float, sy: float): void
  rotate(degrees: float): void
}

export interface Surface {
  getCanvas(): Canvas
  flush(): void
  delete(): void
}

export interface CanvasKitInitOptions {
  wasmUrl?: string
  wasmBinary?: Uint8Array
}

export interface CanvasKitAPI {
  // Factory functions
  MakePaint(): Paint
  MakePath(): Path
  MakeCanvasSurface(canvas: HTMLCanvasElement): Surface | null
  MakeSWCanvasSurface(canvas: HTMLCanvasElement): Surface | null
  
  // Color constants
  RED: ColorInt
  GREEN: ColorInt
  BLUE: ColorInt
  YELLOW: ColorInt
  CYAN: ColorInt
  MAGENTA: ColorInt
  WHITE: ColorInt
  BLACK: ColorInt
  TRANSPARENT: ColorInt
  
  // Enums
  PaintStyle: typeof PaintStyle
  
  // Utility functions
  Color(r: uint8, g: uint8, b: uint8, a?: float): ColorInt
  ColorAsInt(r: uint8, g: uint8, b: uint8, a?: uint8): ColorInt
}

export type CanvasKitInit = (options?: CanvasKitInitOptions) => Promise<CanvasKitAPI>
