import { Offset, Rect } from 'geometry'
import { BoxConstraints } from './Constraints'
import { PaintingContext } from './PaintingContext'
import type { Canvas } from 'bindings'
import type { Obj } from './Object'
import type { ViewConfiguration } from './ViewConfiguration'
import { BoxHitTestResult } from './BoxHitTest'

export class PipelineOwner {
  #rootNode: Obj | null = null
  #configuration: ViewConfiguration | null = null

  get rootNode(): Obj | null {
    return this.#rootNode
  }

  set rootNode(node: Obj | null) {
    this.#rootNode = node
  }

  get configuration(): ViewConfiguration | null {
    return this.#configuration
  }

  set configuration(configuration: ViewConfiguration | null) {
    this.#configuration = configuration
  }

  hitTest(position: Offset): BoxHitTestResult {
    const result = new BoxHitTestResult()
    const root: any = this.rootNode
    if (root && typeof root.hitTest === 'function') {
      root.hitTest(result, position)
    }
    return result
  }

  dispatchTap(position: Offset): boolean {
    const hit = this.hitTest(position)

    for (const entry of hit.path) {
      const target: any = entry.target
      if (typeof target?.onTap === 'function') {
        target.onTap()
        return true
      }
    }

    return false
  }

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
