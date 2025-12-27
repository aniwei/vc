import { Rect } from 'bindings'
import { Alignment } from './Alignment'

export enum ImageRepeat {
  NoRepeat = 'noRepeat',
  Repeat = 'repeat',
  RepeatX = 'repeatX',
  RepeatY = 'repeatY',
}

export interface DecorationImageOptions {
  fit?: unknown
  alignment?: Alignment
  center?: Rect | null
  repeat?: ImageRepeat
  matchTextDirection?: boolean
  scale?: number
  opacity?: number
  isAntiAlias?: boolean
}

export class DecorationImage {
  constructor(public readonly options: DecorationImageOptions = {}) {}

  createPainter(_onChange: VoidFunction): DecorationImagePainter {
    return new DecorationImagePainter(this)
  }
}

export class DecorationImagePainter {
  constructor(public readonly details: DecorationImage) {}
  dispose() {}
}
