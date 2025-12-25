/**
 * CanvasKit Type Definitions for cheap WebAssembly Runtime
 * 
 * These types define the CanvasKit API that will be exposed through
 * the cheap WebAssembly runtime.
 */

export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

export interface Color {
  r: number
  g: number
  b: number
  a: number
}

export type ColorInt = number

export interface Point {
  x: number
  y: number
}

export interface Paint {
  setColor(color: ColorInt): void
  setAntiAlias(aa: boolean): void
  setStyle(style: PaintStyle): void
  setStrokeWidth(width: number): void
  delete(): void
}

export enum PaintStyle {
  Fill = 0,
  Stroke = 1
}

export interface Path {
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  close(): void
  reset(): void
  delete(): void
}

export interface Canvas {
  clear(color: ColorInt): void
  drawRect(rect: Rect, paint: Paint): void
  drawPath(path: Path, paint: Paint): void
  drawCircle(cx: number, cy: number, radius: number, paint: Paint): void
  save(): number
  restore(): void
  translate(dx: number, dy: number): void
  scale(sx: number, sy: number): void
  rotate(degrees: number): void
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
  Color(r: number, g: number, b: number, a?: number): ColorInt
  ColorAsInt(r: number, g: number, b: number, a?: number): ColorInt
}

export type CanvasKitInit = (options?: CanvasKitInitOptions) => Promise<CanvasKitAPI>
