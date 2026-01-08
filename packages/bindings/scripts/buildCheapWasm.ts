import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

function parseArgs(argv: string[]) {
  const args = new Set(argv)
  const help = args.has('--help') || args.has('-h')
  const webgl = args.has('--webgl')
  const webgpu = args.has('--webgpu')
  const noSync = args.has('--no-sync')
  return { help, webgl, webgpu, noSync }
}

function usage() {
  // Keep this minimal: only the flags we actually support.
  // eslint-disable-next-line no-console
  console.log(`\nUsage:\n  pnpm -C packages/bindings wasm:build [--webgl] [--webgpu] [--no-sync]\n\nWhat it does:\n  - Runs third-party Skia CanvasKit cheap wasm build (no JS glue)\n  - Copies output wasm into packages/workstation/public/cheap/canvaskit.wasm (unless --no-sync)\n\nEnv overrides (optional):\n  - EMSDK_DIR, EMXX, SKIA_BUILD_DIR, OUT_DIR\n`)
}

function main() {
  const { help, webgl, webgpu, noSync } = parseArgs(process.argv.slice(2))
  if (help) {
    usage()
    return
  }

  const here = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = path.resolve(here, '../../..')

  const buildScript = path.resolve(
    repoRoot,
    'packages/third-party/skia/modules/canvaskit/build_canvaskit_cheap.sh',
  )

  if (!fs.existsSync(buildScript)) {
    throw new Error(`build script not found: ${buildScript}`)
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    CHEAP_WEBGL: webgl ? '1' : process.env.CHEAP_WEBGL ?? '0',
    CHEAP_WEBGPU: webgpu ? '1' : process.env.CHEAP_WEBGPU ?? '0',
  }

  const result = spawnSync('bash', [buildScript], {
    cwd: repoRoot,
    env,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  if (noSync) {
    return
  }

  const outDir = env.OUT_DIR
    ? path.resolve(repoRoot, env.OUT_DIR)
    : path.resolve(repoRoot, 'packages/third-party/skia/out/canvaskit_wasm_cheap_no_glue')

  const builtWasm = path.join(outDir, 'canvaskit.wasm')
  if (!fs.existsSync(builtWasm)) {
    throw new Error(`built wasm not found: ${builtWasm}`)
  }

  const workstationWasm = path.resolve(repoRoot, 'packages/workstation/public/cheap/canvaskit.wasm')
  fs.mkdirSync(path.dirname(workstationWasm), { recursive: true })
  fs.copyFileSync(builtWasm, workstationWasm)

  // eslint-disable-next-line no-console
  console.log(`ok: synced ${workstationWasm}`)
}

main()
