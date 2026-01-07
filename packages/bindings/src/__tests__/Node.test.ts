import { beforeAll, describe, expect, it } from 'vitest'

import { Node } from '../Node'
import { ensureCanvasKitReady } from './helpers/ensureCanvasKit'

class TestNode extends Node<TestNode, string> {
  children: TestNode[] = []

  redepthChildren(): void {
    for (const c of this.children) {
      this.redepthChild(c)
    }
  }

  add(child: TestNode): void {
    this.children.push(child)
    this.adoptChild(child)
  }
}

describe('Node', () => {
  beforeAll(async () => {
    // Requirement: suite should load real wasm.
    await ensureCanvasKitReady()
  })

  it('adoptChild attaches and updates depth', () => {
    const root = new TestNode()
    const child = new TestNode()
    const grand = new TestNode()

    root.attach('owner')
    root.add(child)
    child.add(grand)

    expect(child.owner).toBe('owner')
    expect(grand.owner).toBe('owner')
    expect(child.depth).toBe(1)
    expect(grand.depth).toBe(2)

    child.dropChild(grand)
    expect(grand.owner).toBe(null)
  })
})
