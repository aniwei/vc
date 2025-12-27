import { Container } from './Container'
import { PipelineOwner } from './PipelineOwner'
import type { ViewConfiguration } from './ViewConfiguration'
import type { CanvasLike } from 'painting'

export interface ViewOptions {
  configuration: ViewConfiguration
}

export class View extends Container {
  static create(options?: unknown): View {
    if (options && typeof options === 'object' && 'configuration' in (options as any)) {
      return new View((options as ViewOptions).configuration)
    }

    return new View(options as ViewConfiguration)
  }

  readonly pipeline = new PipelineOwner()

  constructor(public configuration: ViewConfiguration) {
    super([])
    this.pipeline.configuration = configuration
    this.pipeline.setRoot(this)
  }

  frame(canvas: CanvasLike | null): void {
    this.pipeline.configuration = this.configuration
    this.pipeline.flushLayout()
    this.pipeline.flushPaint(canvas)
  }
}
