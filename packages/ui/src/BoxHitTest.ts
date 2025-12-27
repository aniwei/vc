import { Offset } from 'painting'
import type { Box } from './Box'

export interface BoxHitTestEntry {
  target: Box
  position: Offset
}

export class BoxHitTestResult {
  readonly path: BoxHitTestEntry[] = []

  add(target: Box, position: Offset): void {
    this.path.push({ target, position })
  }
}
