import { ImageConfiguration } from './ImageProvider'
import { Offset, Size, TextDirection } from 'bindings'
import { Canvas } from 'bindings'

export type VoidCallback = () => void

export enum DecorationShape {
  Rectangle = 0,
  Circle = 1,
  Irregular = 2,
}

export abstract class Decoration {
  abstract createPainter(onChanged: VoidCallback, oldPainter?: BoxPainter | null): BoxPainter

  private listeners: Set<VoidCallback> | null = null

  addListener(listener: VoidCallback): void {
    this.listeners ??= new Set<VoidCallback>()
    this.listeners.add(listener)
  }

  removeListener(listener: VoidCallback): void {
    this.listeners?.delete(listener)
    if (this.listeners && this.listeners.size === 0) {
      this.listeners = null
    }
  }

  /**
   * Publishes a change notification to listeners.
   *
   * This is a minimal hook for higher-level widgets to invalidate cached
   * painters when a Decoration instance is mutated in-place.
   */
  publish(): void {
    if (!this.listeners || this.listeners.size === 0) {
      return
    }

    for (const listener of Array.from(this.listeners)) {
      try {
        listener()
      } catch {
        // Keep notifying other listeners.
      }
    }
  }
  
  // Optional APIs (used by higher-level widgets in at). Keep as non-abstract
  // to avoid breaking existing subclasses.
  lerpFrom(_a: Decoration | null, _t: number): Decoration | null {
    return null
  }

  lerpTo(_b: Decoration | null, _t: number): Decoration | null {
    return null
  }

  hitTest(_size: Size, _position: Offset, _textDirection?: TextDirection | null): boolean {
    return true
  }
}

export abstract class BoxPainter {
  constructor(public onChanged: VoidCallback) {}
  
  abstract paint(canvas: Canvas, offset: Offset, configuration: ImageConfiguration): void
  
  dispose(): void {}
}
