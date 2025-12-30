import { NWayCanvas } from './n-way-canvas'
import { Canvas } from './canvas'
import { RasterCache } from './rasterizer'

export class PaintContext {
  public leaf: Canvas
  public internal: NWayCanvas

  constructor (
    internal: NWayCanvas, 
    leaf: Canvas
  ) {
    this.internal = internal
    this.leaf = leaf
  }
}