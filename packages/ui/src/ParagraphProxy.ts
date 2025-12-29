import type { TextAlign } from 'bindings'
import type { TextOverflow } from 'painting'

export class ParagraphProxy {
  
  constructor(
    public text: string,
    public fontBytes: Uint8Array | null = null,
    public fontSize: number | undefined = undefined,
    public color: number | undefined = undefined,
    public textAlign: TextAlign | undefined = undefined,
    public maxLines: number | null = null,
    public overflow: TextOverflow | null = null,
    public ellipsis: string | null = null,
  ) {}
}
