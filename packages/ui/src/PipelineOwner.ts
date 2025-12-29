import { Offset, Rect } from 'geometry'
import { BoxConstraints } from './Constraints'
import { PaintingContext } from './PaintingContext'
import type { Canvas } from 'bindings'
import type { Obj } from './Object'
import type { ViewConfiguration } from './ViewConfiguration'

export class PipelineOwner {
  rootNode: Obj | null = null
  configuration: ViewConfiguration | null = null

  setRoot(node: Obj | null): void {
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

  flushPaint(canvas: Canvas | null = null): boolean {
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
      
    const context = new PaintingContext(this, bounds)
    context.canvas = canvas
    this.rootNode.paintWithContext(context, Offset.ZERO)

    return true
  }
}
