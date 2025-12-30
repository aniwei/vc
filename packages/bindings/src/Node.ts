import invariant from 'invariant'

export abstract class Node<T extends Node<T, Owner>, Owner> {
  get attached () {
    return this.owner !== null
  }

  #owner: Owner | null = null
  public get owner () {
    return this.#owner
  }

  public set owner (owner: Owner | null) {
    this.#owner = owner
  }

  public depth = 0
  public parent: T | null = null

  /**
   * 
   * @param {T} child 
   */
  redepthChild (child: T) {
    invariant(child.owner === this.owner, 'The "child.depth" must be equal "this.owner"')
    
    if (child.depth <= this.depth) {
      child.depth = this.depth + 1
      child.redepthChildren()
    }
  }
  
  redepthChildren () {}

  attach (owner: Owner) {
    invariant(owner !== null, 'The argument "owner" cannot be null.')
    this.owner = owner
  }

  detach () {
    invariant(this.owner !== null, 'The "this.owner" cannot be null.')
    this.owner = null
  }

  adoptChild (child: T) {
    invariant(child !== null, `The argument "child" cannot be null.`)
    invariant(this.owner !== null, ``)
    child.parent = this as unknown as T

    if (this.attached) {
      child.attach(this.owner)
    }

    this.redepthChild(child)
  }

  dropChild (child: T) {
    invariant(child.parent === this as unknown as T, 'The "child.parent" cannot refer to itself.')
    child.parent = null
    
    if (this.attached) {
      child.detach()
    }
  }
}

