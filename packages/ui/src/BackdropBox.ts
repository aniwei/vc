import { Box } from './Box'

export class BackdropBox extends Box {
  constructor(
    public child: Box | null = null,
    public filter: unknown | null = null,
    public blendMode: unknown | null = null,
  ) {
    super()
    if (this.child) {
      this.adoptChild(this.child)
    }
  }
}
