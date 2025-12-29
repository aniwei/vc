import { Box } from './Box'
import { Offset, Size } from 'geometry'
import type { BoxConstraints } from './Constraints'

export interface PositionedBoxOptions {
  child: Box
  left?: number | null
  top?: number | null
  right?: number | null
  bottom?: number | null
  width?: number | null
  height?: number | null
}

export class PositionedBox extends Box {
  static create(options: PositionedBoxOptions): PositionedBox {
    return new PositionedBox(
      options.child,
      options.left ?? null,
      options.top ?? null,
      options.right ?? null,
      options.bottom ?? null,
      options.width ?? null,
      options.height ?? null)
  }

  #left: number | null = null
  #top: number | null = null
  #right: number | null = null
  #bottom: number | null = null
  #width: number | null = null
  #height: number | null = null

  get left(): number | null {
    return this.#left
  }

  set left(value: number | null) {
    if (this.#left === value) return
    this.#left = value
    this.markNeedsLayout()
  }

  get top(): number | null {
    return this.#top
  }

  set top(value: number | null) {
    if (this.#top === value) return
    this.#top = value
    this.markNeedsLayout()
  }

  get right(): number | null {
    return this.#right
  }

  set right(value: number | null) {
    if (this.#right === value) return
    this.#right = value
    this.markNeedsLayout()
  }

  get bottom(): number | null {
    return this.#bottom
  }

  set bottom(value: number | null) {
    if (this.#bottom === value) return
    this.#bottom = value
    this.markNeedsLayout()
  }

  get width(): number | null {
    return this.#width
  }

  set width(value: number | null) {
    if (this.#width === value) return
    this.#width = value
    this.markNeedsLayout()
  }

  get height(): number | null {
    return this.#height
  }

  set height(value: number | null) {
    if (this.#height === value) return
    this.#height = value
    this.markNeedsLayout()
  }

  get positioned(): boolean {
    return (
      this.#left !== null ||
      this.#top !== null ||
      this.#right !== null ||
      this.#bottom !== null ||
      this.#width !== null ||
      this.#height !== null
    )
  }

  get child(): Box | null {
    return this.firstChild as Box | null
  }

  override layout(constraints: BoxConstraints): void {
    this.constraints = constraints

    const child = this.child
    if (child) {
      child.offset = Offset.ZERO
      child.layout(constraints)
      const childSize = child.size ?? new Size(0, 0)
      this.size = constraints.constrain(childSize)
    } else {
      this.size = constraints.constrain(new Size(0, 0))
    }

    this.needsLayout = false
  }

  constructor(
    child: Box,
    left: number | null = null,
    top: number | null = null,
    right: number | null = null,
    bottom: number | null = null,
    width: number | null = null,
    height: number | null = null,
  ) {
    super()
    this.adoptChild(child)
    this.#left = left
    this.#top = top
    this.#right = right
    this.#bottom = bottom
    this.#width = width
    this.#height = height
  }
}
