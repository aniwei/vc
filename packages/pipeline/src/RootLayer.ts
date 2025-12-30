import { ContainerLayer } from './ContainerLayer'
import { PaintContext } from './PaintContext'

export class RootLayer extends ContainerLayer {
  paint (context: PaintContext) {
    this.paintChildren(context)
  }
}