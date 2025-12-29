# workstation

最小的 Vite 入口，用 `ui` 通过 `bindings.Surface.makeSw(...)` 渲染到 SW surface，再把 `readPixelsRgba8888` 的像素 blit 到浏览器 `<canvas>`。

## 开发

- 启动：`pnpm -C packages/workstation dev -- --port 5174 --strictPort --host 127.0.0.1`
- 访问：`http://127.0.0.1:5174/`

CanvasKit wasm 走静态资源：`public/cheap/canvaskit.wasm`，代码里使用 `CanvasKitApi.ready({ uri: '/cheap/canvaskit.wasm' })`。
