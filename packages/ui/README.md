# ui

这个包的渲染目标是 **直接使用 `bindings/Canvas`**（不再提供 CanvasLike / 适配器层）。

## 最小用法（传入 `bindings.Surface.canvas`）

```ts
import { CanvasKitApi, Surface } from 'bindings'
import { View, ViewConfiguration } from 'ui'

// 1) 先确保 bindings 的 CanvasKitApi 已 ready
await CanvasKitApi.ready({ uri: '/canvaskit.wasm' })

// 2) 创建 Surface，并从 Surface 取到 Canvas
const surface = Surface.makeSw(800, 600)
const canvas = surface.canvas

// 3) 创建 UI View，并在每帧把 canvas 传入 frame()
const view = new View(new ViewConfiguration(800, 600, window.devicePixelRatio))
view.frame(canvas)

// 4) 需要显示到屏幕时，flush surface
surface.flush()

// 5) 释放资源
surface.dispose()
```

说明：`view.frame(...)` 的参数类型是 `bindings.Canvas | null`，推荐直接传 `surface.canvas`。
