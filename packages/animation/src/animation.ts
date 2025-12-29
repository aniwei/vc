import { Subscribable } from '@at/basic'
import { Animatable } from './tween'

export enum AnimationStateKind {
  Dismissed,
  Forward,
  Reverse,
  Completed,
}

export interface AnimationStateSubscriber {
  (status: AnimationStateKind): void
}

export class AnimationStateSubscribable extends Subscribable<AnimationStateSubscriber> {}

export interface AnimationFactory<T> {
  create(...rests: unknown[]): T
  new (...rests: unknown[]): T
}

export abstract class Animation<T> extends AnimationStateSubscribable {
  static create<T>(...rests: unknown[]) {
    const AnimationFactory = this as unknown as AnimationFactory<T>
    return new AnimationFactory(...rests) as T
  }

  public get dismissed() {
    return this.state === AnimationStateKind.Dismissed
  }

  public get completed(): boolean {
    return this.state === AnimationStateKind.Completed
  }

  abstract value: T | null
  abstract state: AnimationStateKind

  drive(child: Animatable<T>): Animation<T> {
    return child.animate(this as Animation<T>)
  }
}
