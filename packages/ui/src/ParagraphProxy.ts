export interface ParagraphProxyOptions {
  text: string
}

export class ParagraphProxy {
  static create(options: ParagraphProxyOptions): ParagraphProxy {
    return new ParagraphProxy(options.text)
  }

  constructor(public text: string) {}
}
