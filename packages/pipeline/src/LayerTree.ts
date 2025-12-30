import { Size } from 'geometry'
import { RootLayer } from './RootLayer'
import { PrerollContext } from './PrerollContext'

export class LayerTree {
  static create (root: RootLayer) {
    return new LayerTree(root)
  }

  public root: RootLayer
  public frame: Size = new Size(600, 600)
  public devicePixelRatio: number | null = null

  /**
   * 构造函数
   * @param {RootLayer} rootLayer
   * @return {*}
   */  
  constructor (root: RootLayer) {
    this.root = root
  }
  
  /**
   * 预处理
   * @param {Frame} frame
   * @param {boolean} ignoreCache
   * @return {void}
   */
  preroll (frame: SurfaceFrame, ignoreCache: boolean = false) {
    const context = new PrerollContext()
    this.root.preroll(context, Matrix4.identity())
  }

  /**
   * 绘制 
   * @param {AtFrame} frame
   * @param {boolean} ignoreCache
   * @return {void}
   */
  paint (frame: SurfaceFrame, ignoreCache: boolean = false): void {
    const nw = NWayCanvas.create()
    nw.push(frame.canvas)
    nw.clear(Color.CLEAR)

    
    const context = PaintContext.create(nw, frame.canvas, ignoreCache ? null : frame.caches)
    
    if (!this.root.ignored) {
      this.root.paint(context)
    }
  }


  /**
   * 
   * @return {Picture}
   */
  flatten (): Picture {
    const recorder = Recorder.create(Rect.LARGEST)
    const prerollContext: PrerollContext = new PrerollContext(null)
    
    this.root.preroll(prerollContext, Matrix4.identity())

    const nw: NWayCanvas = NWayCanvas.create()
    nw.push(recorder)

    const paintContext = new PaintContext(nw, recorder, null)

    if (!this.root.ignored) {
      this.root.paint(paintContext)
    }

    return recorder.stop()
  }
}