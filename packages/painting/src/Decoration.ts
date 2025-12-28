import { VoidCallback } from './Basic'
import { ImageConfiguration } from './ImageProvider'
import { Offset } from 'geometry'
import { Canvas } from 'bindings'

export abstract class Decoration {
  abstract createPainter(onChanged: VoidCallback): BoxPainter
  
  // abstract lerpFrom(a: Decoration | null, t: number): Decoration | null
  // abstract lerpTo(b: Decoration | null, t: number): Decoration | null
  // abstract hitTest(size: Size, position: Offset, textDirection?: TextDirection): boolean
}

export abstract class BoxPainter {
  constructor(public onChanged: VoidCallback) {}
  
  abstract paint(canvas: Canvas, offset: Offset, configuration: ImageConfiguration): void
  
  dispose(): void {}
}
