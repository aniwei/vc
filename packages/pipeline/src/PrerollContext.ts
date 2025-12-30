
import { Mat4, Rect, RRect } from 'geometry'
import { Eq } from 'shared'

import { Path } from 'bindings'


import { RasterCache } from './rasterizer'

export enum MutatorTag {
  ClipRect,
  ClipRRect,
  ClipPath,
  Transform,
  Opacity,
}

//// => Mutator
// 变更
export interface MutatorOptions {
  tag: MutatorTag,
  rect?: Rect | null,
  rrect?: RRect | null,
  path?: Path | null,
  matrix?: Mat4 | null,
  alpha?: number | null,
}

export class Mutator extends Eq<Mutator> {
  static create (options: MutatorOptions) {
    return new Mutator(
      options.tag,
      options.rect,
      options.rrect,
      options.path,
      options.matrix,
      options.alpha)
  }

  // => 类型
  public tag: MutatorTag 
  // => 路径
  public path: Path | null
  // => 矩形
  public rect: Rect | null
  // => 圆角矩形
  public rrect: RRect | null
  // => 矩阵
  public matrix: Mat4 | null
  public alpha: number | null

  constructor (
    tag: MutatorTag,
    rect: Rect | null = null,
    rrect: RRect | null = null,
    path: Path | null = null,
    matrix: Mat4 | null = null,
    alpha: number | null = null,
  ) {
    super()
    
    this.tag = tag
    this.rect = rect
    this.rrect = rrect
    this.path = path
    this.matrix = matrix
    this.alpha = alpha
  }

  static clipRect (rect: Rect ) {
    return Mutator.create({
      tag: MutatorTag.ClipRect, 
      rect
    })
  }

  /**
   * @param {RRect} rrect
   * @return {Mutator}
   */  
  static clipRRect (rrect: RRect) {
    return Mutator.create({
      tag: MutatorTag.ClipRRect, 
      rrect
    })
  }

  static clipPath (path: Path) {
    return Mutator.create({
      tag: MutatorTag.ClipPath, 
      path,
    })
  }

  static transform (matrix: Mat4) {
    return Mutator.create({
      tag: MutatorTag.Transform, 
      matrix
    })
  }
  
  /**
   * @param {number} alpha
   * @return {*}
   */  
  static opacity (alpha: number) {
    return Mutator.create({
      tag: MutatorTag.Opacity, 
      alpha
    })
  }

  // => isClip
  public get isClip (): boolean {
    return (
      this.kind === MutatorKind.ClipRect ||
      this.kind === MutatorKind.ClipRRect ||
      this.kind === MutatorKind.ClipPath
    )
  }

  // => alphaFloat
  public get alphaFloat (): number {
    return this.alpha! / 255.0
  }

  /**
   * 是否相等
   * @param {Mutator | null} other 
   * @returns {boolean}
   */
  equal (other: Mutator | null): boolean {
    return (
      other instanceof Mutator && (
        !!other.rect?.equal(this.rect ?? null) ||
        !!other.rrect?.equal(this.rrect ?? null)
      )
    )
  }

  /**
   * 是否相等
   * @param {Mutator | null} other 
   * @returns {boolean}
   */
  notEqual (other: Mutator | null): boolean {
    return !this.equal(other)
  }
}

export class PrerollContext extends Equalable<PrerollContext> {
  static create (cache: RasterCache | null) {
    return new PrerollContext(cache)
  }

   /**
   * @param {PrerollContext} context
   * @return {PrerollContext}
   */  
   static copy (origin: PrerollContext) {
    const context = PrerollContext.create(origin.cache)
    
    for (const mut of origin.mutators) {
      context.mutators.push(mut)
    }
    
    return context
  }

  // => cullRect
  // 获取绘制范围
  public get cullRect () {
    let cullRect = Rect.LARGEST
    for (const mutator of this.mutators) {
      let rect: Rect = Rect.Zero

      switch (mutator.kind) {
        case MutatorKind.ClipRect:
          invariant(mutator.rect)
          rect = mutator.rect
          break

        case MutatorKind.ClipRRect:
          invariant(mutator.rrect)
          rect = mutator.rrect.outer
          break

        case MutatorKind.ClipPath:
          invariant(mutator.path)
          rect = mutator.path.getBounds()
          break
      }

      cullRect = cullRect.intersect(rect)
    }
      
    return cullRect
  }

  public cache: RasterCache | null
  public mutators: Mutator[] = []

  constructor (cache: RasterCache | null) {
    super()
    this.cache = cache 
  }

  pushClipRect (rect: Rect) {
    this.mutators.push(Mutator.clipRect(rect))
  }

  pushClipRRect (rrect: RRect) {
    this.mutators.push(Mutator.clipRRect(rrect))
  }

  pushClipPath (path: Path) {
    this.mutators.push(Mutator.clipPath(path))
  }

  pushTransform (matrix: Mat4) {
    this.mutators.push(Mutator.transform(matrix))
  }

  /**
   * @param {number} alpha
   */  
  pushOpacity (alpha: number) {
    this.mutators.push(Mutator.opacity(alpha))
  }

  pop () {
    this.mutators.pop()
  }

  /**
   * 是否相等
   * @param {PrerollContext} other
   * @return {boolean}
   */  
  eq (other: PrerollContext | null) {
    return (
      other instanceof PrerollContext &&
      listEquals<Mutator>(other.mutators, this.mutators))
  }

  /**
   * 是否相等
   * @param {PrerollContext} other
   * @return {boolean}
   */  
  notEq (other: PrerollContext | null) {
    return !this.eq(other)
  }
}