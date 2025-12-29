import type { ImageConfiguration } from './ImageProvider'
import type { Decoration } from './Decoration'
import { BoxPainter, type VoidCallback } from './Decoration'

/**
 * Minimal composite painter base (modeled after at): lazily builds and caches
 * a list of built-in painters, and disposes them as a group.
 */
export abstract class DecorationCompositePainter<D extends Decoration> extends BoxPainter {
  private painters: BoxPainter[] | null = null

  private readonly handleDecorationChanged = () => {
    if (this.painters) {
      for (const painter of this.painters) {
        painter.dispose()
      }
    }
    this.painters = null
    this.onChanged()
  }

  constructor(
    onChanged: VoidCallback,
    protected decoration: D,
  ) {
    super(onChanged)

    // If the decoration is mutated in-place and publishes changes, rebuild the
    // cached painter list next paint.
    this.decoration.addListener(this.handleDecorationChanged)
  }

  updateDecoration(next: D): void {
    if (this.decoration === next) {
      return
    }

    this.decoration.removeListener(this.handleDecorationChanged)
    this.decoration = next
    this.decoration.addListener(this.handleDecorationChanged)

    // Ensure next paint rebuilds built-in painters against the new decoration.
    if (this.painters) {
      for (const painter of this.painters) {
        painter.dispose()
      }
    }
    this.painters = null
    this.onChanged()
  }

  protected abstract createPainters(): BoxPainter[]

  override paint(canvas: any, offset: any, configuration: ImageConfiguration): void {
    this.painters ??= this.createPainters()
    for (const painter of this.painters) {
      painter.paint(canvas, offset, configuration)
    }
  }

  override dispose(): void {
    this.decoration.removeListener(this.handleDecorationChanged)
    if (this.painters) {
      for (const painter of this.painters) {
        painter.dispose()
      }
    }
    this.painters = null
  }
}
