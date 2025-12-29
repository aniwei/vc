import { Offset, Size } from 'geometry'
import { Box } from './Box'
import type { PaintingContext } from './PaintingContext'

export interface CustomBoxOptions<T extends CustomBoxPainter = CustomBoxPainter> {
  painter: T
  child?: Box | null
}

export abstract class CustomBoxPainter {
  abstract paint(context: PaintingContext, size: Size, offset: Offset): void
  hitTest(_position: Offset): boolean {
    return false
  }
}

export class CustomBox<T extends CustomBoxPainter = CustomBoxPainter> extends Box {
  static create<T extends CustomBoxPainter = CustomBoxPainter>(options: CustomBoxOptions<T>): CustomBox<T> {
    return new CustomBox(options.painter, options.child ?? null)
  }

  constructor(
    public painter: T,
    public child: Box | null = null,
  ) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }

  override paint(context: PaintingContext, offset: Offset): void {
    const size = this.size ?? new Size(0, 0)
    this.painter.paint(context, size, offset)
    super.paint(context, offset)
  }
}
