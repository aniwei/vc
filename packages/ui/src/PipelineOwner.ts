import { Offset, Rect } from 'painting'
import type { CanvasLike } from 'painting'
import { BoxConstraints } from './Constraints'
import type { RenderObject } from './Object'
import { PaintingContext } from './PaintingContext'
import type { ViewConfiguration } from './ViewConfiguration'

export class PipelineOwner {
  rootNode: RenderObject | null = null
  configuration: ViewConfiguration | null = null

  setRoot(node: RenderObject | null): void {
    if (this.rootNode === node) {
      return
    }

    this.rootNode?.detach()
    this.rootNode = node
    this.rootNode?.attach(this)
  }

  flushLayout(): boolean {
    if (!this.rootNode) {
      return false
    }

    if (!this.rootNode.needsLayout) {
      return false
    }

    const configuration = this.configuration
    if (configuration) {
      this.rootNode.layout(BoxConstraints.tight(configuration.size))
    } else {
      this.rootNode.layout(BoxConstraints.create())
    }

    return true
  }

  flushPaint(canvas: CanvasLike | null = null): boolean {
    if (!this.rootNode) {
      return false
    }

    if (!this.rootNode.needsPaint) {
      return false
    }

    const configuration = this.configuration
    const bounds = configuration
      ? Rect.fromLTWH(0, 0, configuration.width, configuration.height)
      : Rect.fromLTWH(0, 0, 0, 0)
    const context = PaintingContext.create(this, null, bounds)
    context.canvas = canvas
    this.rootNode.paintWithContext(context, Offset.ZERO)

    return true
  }
}
