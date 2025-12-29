import { Box } from './Box'
import { Offset } from 'geometry'
import { TextDirection } from 'bindings'
import { Decoration, ImageConfiguration, type BoxPainter } from 'painting'
import type { PaintingContext } from './PaintingContext'
import type { BoxHitTestResult } from './BoxHitTest'

export interface DecoratedBoxOptions {
  child?: Box | null
  decoration?: Decoration | null
}

export class DecoratedBox extends Box {
  #painter: BoxPainter | null = null
  #lastDecoration: Decoration | null = null
  #decoration: Decoration | null = null

  static create(options: DecoratedBoxOptions = {}): DecoratedBox {
    return new DecoratedBox(options.child ?? null, options.decoration ?? null)
  }

  constructor(
    public child: Box | null = null,
    decoration: Decoration | null = null,
  ) {
    super()
    this.#decoration = decoration
    if (this.child) {
      this.adoptChild(this.child)
    }
  }

  get decoration(): Decoration | null {
    return this.#decoration
  }

  set decoration(next: Decoration | null) {
    if (this.#decoration === next) {
      return
    }

    this.#decoration = next

    // Preserve the current painter so the next ensurePainter() call can reuse
    // it via Decoration.createPainter(onChanged, oldPainter).
    // If decoration is cleared, dispose eagerly.
    if (!next) {
      this.#painter?.dispose()
      this.#painter = null
    }
    this.#lastDecoration = null
    this.markNeedsPaint()
  }

  setDecoration(next: Decoration | null): void {
    this.decoration = next
  }

  private ensurePainter(): BoxPainter | null {
    const decoration = this.#decoration
    if (!decoration) {
      this.#painter?.dispose()
      this.#painter = null
      this.#lastDecoration = null
      return null
    }

    if (this.#lastDecoration !== decoration) {
      const oldPainter = this.#painter
      const nextPainter = decoration.createPainter(() => this.markNeedsPaint(), oldPainter)
      if (oldPainter && nextPainter !== oldPainter) {
        oldPainter.dispose()
      }
      this.#painter = nextPainter
      this.#lastDecoration = decoration
    }

    return this.#painter
  }

  override paint(context: PaintingContext, offset: Offset): void {
    const painter = this.ensurePainter()
    const canvas = context.canvas
    const size = this.size

    if (painter && canvas && size) {
      const dpr = context.pipeline?.configuration?.devicePixelRatio ?? null
      const dir = context.pipeline?.configuration?.textDirection ?? TextDirection.LTR
      const configuration = new ImageConfiguration(dpr, size, dir)
      painter.paint(canvas, offset, configuration)
    }

    this.defaultPaint(context, offset)
    this.needsPaint = false
  }

  override hitTest(result: BoxHitTestResult, position: Offset): boolean {
    const size = this.size
    if (!size) {
      return false
    }

    // Fast bounds check.
    if (!(size.width > 0 && size.height > 0)) {
      return false
    }

    if (position.dx < 0 || position.dy < 0 || position.dx > size.width || position.dy > size.height) {
      return false
    }

    const dir = this.owner?.configuration?.textDirection ?? TextDirection.LTR
    if (this.#decoration && !this.#decoration.hitTest(size, position, dir)) {
      return false
    }

    // Hit test children (top-most first).
    let child = this.lastChild as Box | null
    while (child) {
      const childPos = position.translate(-child.offset.dx, -child.offset.dy)

      if (child.hitTest(result, childPos)) {
        result.add(this, position)
        return true
      }

      child = child.previousSibling as Box | null
    }

    // Hit self.
    result.add(this, position)
    return true
  }

  override dispose(): void {
    this.#painter?.dispose()
    this.#painter = null
    this.#lastDecoration = null
    super.dispose()
  }
}
