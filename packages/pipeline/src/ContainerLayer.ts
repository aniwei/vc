import invariant from 'invariant'
import { Layer } from './Layer'
import { Mat4, Rect } from 'geometry'
import { PrerollContext } from './PrerollContext'
import { PaintContext } from './PaintContext'
import { PipelineOwner } from './PipelineOwner'
 
export abstract class ContainerLayer extends Layer {
  public firstChild: Layer | null = null 
  public lastChild: Layer | null = null 

  public get hasChildren () {
    return this.firstChild !== null
  }

  /**
   * 挂载
   * @param {unknown} owner 
   */
  attach (owner: PipelineOwner) {
    super.attach(owner)
    let child: Layer | null = this.firstChild

    while (child !== null) {
      child.attach(owner)
      child = child.nextSibling
    }
  }

  /**
   * 卸载
   */
  detach() {
    super.detach()
    let child: Layer | null = this.firstChild

    while (child !== null) {
      child.detach()
      child = child.nextSibling ?? null
    }
  }

  /**
   * 插入层
   * @param {Layer} child 
   */
  append (child: Layer) {
    this.adoptChild(child)
    child.previousSibling = this.lastChild

    if (this.lastChild !== null) {
      this.lastChild.nextSibling = child
    }

    this.lastChild = child
    this.firstChild ??= child
  }

  /**
   * 删除层
   * @param {Layer} child 
   */
  removeChild (child: Layer) {
    if (child.previousSibling === null) {
      this.firstChild = child.nextSibling
    } else {
      child.previousSibling.nextSibling = child.nextSibling
    }

    if (child.nextSibling === null) {
      this.lastChild = child.previousSibling
    } else {
      child.nextSibling.previousSibling = child.previousSibling
    }
    
    child.previousSibling = null
    child.nextSibling = null

    this.dropChild(child)
  }

  removeAllChildren () {
    let child: Layer | null = this.firstChild

    while (child !== null) {
      const next: Layer | null = child.nextSibling
      child.previousSibling = null
      child.nextSibling = null

      this.dropChild(child)
      child = next
    }
    
    this.firstChild = null
    this.lastChild = null
  }

  applyTransform (
    child: Layer | null, 
    transform: Mat4
  ) {
    
  }
  
  depthFirstIterateChildren (): Layer[] {
    if (this.firstChild === null) {
      return []
    }

    let children: Layer[] = []
    let child: Layer | null = this.firstChild

    while (child !== null) {
      children.push(child)

      if (child instanceof ContainerLayer) {
        children = children.concat(child.depthFirstIterateChildren())
      }

      child = child.nextSibling
    }

    return children
  }

  /**
   * 合并子节点绘制边界
   * @param {PrerollContext} context
   * @param {Matrix4} childMatrix
   * @return {Rect}
   */  
  prerollChildren (context: PrerollContext, mat: Mat4): Rect {
    let childPaintBounds: Rect = Rect.Zero
    let child: Layer | null = this.firstChild

    while (child !== null) {
      child.preroll(context, mat)

      if (childPaintBounds.isEmpty()) {
        childPaintBounds = child.bounds
      } else if (!child.bounds.isEmpty()) {
        childPaintBounds = childPaintBounds.expandToInclude(child.bounds)
      }

      child = child.nextSibling
    }

    return childPaintBounds
  }

  /**
   * @param {PaintContext} context
   * @return {*}
   */  
  paintChildren (context: PaintContext) {
    let child: Layer | null = this.firstChild
    
    while (child !== null) {
      if (!child.isEmpty()) {
        child.paint(context)
      }

      child = child.nextSibling
    }
  }

  preroll (prerollContext: PrerollContext,  matrix: Mat4) {
    this.bounds = this.prerollChildren(prerollContext, matrix)
  }

  dispose () {
    this.removeAllChildren()
    super.dispose()
  }
}