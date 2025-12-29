import { Container } from './Container'
import { PipelineOwner } from './PipelineOwner'
import type { ViewConfiguration } from './ViewConfiguration'
import type { Canvas } from 'bindings'
import type { Offset } from 'geometry'

export interface ViewOptions {
  configuration: ViewConfiguration
}

export class View extends Container {
  readonly pipeline = new PipelineOwner()

  constructor(public configuration: ViewConfiguration) {
    super([])
    this.pipeline.configuration = configuration
    this.pipeline.setRoot(this)
  }

  frame(canvas: Canvas | null): void {
    this.pipeline.configuration = this.configuration
    this.pipeline.flushLayout()
    this.pipeline.flushPaint(canvas)
  }

  dispatchTap(position: Offset): boolean {
    return this.pipeline.dispatchTap(position)
  }
}
