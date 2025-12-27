import * as path from 'path'
import * as fs from 'fs/promises'
import { CanvasKitApi } from '../src/CanvasKitApi'

async function main() {
  await CanvasKitApi.ready({
    path: path.resolve(process.cwd(), '../perf-web/public/cheap/canvaskit.wasm')
  })

  const winding = CanvasKitApi.invoke('SkPathFillType_Winding')
  const evenOdd = CanvasKitApi.invoke('SkPathFillType_EvenOdd')
  const inverseWinding = CanvasKitApi.invoke('SkPathFillType_InverseWinding')
  const inverseEvenOdd = CanvasKitApi.invoke('SkPathFillType_InverseEvenOdd')

  const js = []
  js.push(`export enum PathFillType {`)
  js.push(`  Winding = ${winding},`)
  js.push(`  EvenOdd = ${evenOdd},`)
  js.push(`  InverseWinding = ${inverseWinding},`)
  js.push(`  InverseEvenOdd = ${inverseEvenOdd},`)
  js.push(`}`)

  js.push('')
  js.push('export enum PaintStyle {')
  js.push('  Fill = 0,')
  js.push('  Stroke = 1,')
  js.push('  StrokeAndFill = 2,')
  js.push('}')

  js.push('')
  js.push('export enum FilterMode {')
  js.push('  Nearest = 0,')
  js.push('  Linear = 1,')
  js.push('}')

  js.push('')
  js.push('export enum MipmapMode {')
  js.push('  None = 0,')
  js.push('  Nearest = 1,')
  js.push('  Linear = 2,')
  js.push('}')

  js.push('')
  js.push('export enum ClipOp {')
  js.push('  Difference = 0,')
  js.push('  Intersect = 1,')
  js.push('}')

  await fs.writeFile(
    path.resolve(process.cwd(), 'src/enums.ts'),
    js.join('\n')
  )
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})