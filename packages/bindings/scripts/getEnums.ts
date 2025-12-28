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

  const paintStyleFill = CanvasKitApi.invoke('SkPaintStyle_Fill')
  const paintStyleStroke = CanvasKitApi.invoke('SkPaintStyle_Stroke')
  const paintStyleStrokeAndFill = CanvasKitApi.invoke('SkPaintStyle_StrokeAndFill')

  const filterModeNearest = CanvasKitApi.invoke('SkFilterMode_Nearest')
  const filterModeLinear = CanvasKitApi.invoke('SkFilterMode_Linear')

  const mipmapModeNone = CanvasKitApi.invoke('SkMipmapMode_None')
  const mipmapModeNearest = CanvasKitApi.invoke('SkMipmapMode_Nearest')
  const mipmapModeLinear = CanvasKitApi.invoke('SkMipmapMode_Linear')

  const clipOpDifference = CanvasKitApi.invoke('SkClipOp_Difference')
  const clipOpIntersect = CanvasKitApi.invoke('SkClipOp_Intersect')

  const textDirectionLtr = CanvasKitApi.invoke('SkTextDirection_LTR')
  const textDirectionRtl = CanvasKitApi.invoke('SkTextDirection_RTL')

  const textAlignLeft = CanvasKitApi.invoke('SkTextAlign_Left')
  const textAlignRight = CanvasKitApi.invoke('SkTextAlign_Right')
  const textAlignCenter = CanvasKitApi.invoke('SkTextAlign_Center')
  const textAlignJustify = CanvasKitApi.invoke('SkTextAlign_Justify')
  const textAlignStart = CanvasKitApi.invoke('SkTextAlign_Start')
  const textAlignEnd = CanvasKitApi.invoke('SkTextAlign_End')

  const js = []
  js.push(`export enum PathFillType {`)
  js.push(`  Winding = ${winding},`)
  js.push(`  EvenOdd = ${evenOdd},`)
  js.push(`  InverseWinding = ${inverseWinding},`)
  js.push(`  InverseEvenOdd = ${inverseEvenOdd},`)
  js.push(`}`)

  js.push('')
  js.push('export enum PaintStyle {')
  js.push(`  Fill = ${paintStyleFill},`)
  js.push(`  Stroke = ${paintStyleStroke},`)
  js.push(`  StrokeAndFill = ${paintStyleStrokeAndFill},`)
  js.push('}')

  js.push('')
  js.push('export enum FilterMode {')
  js.push(`  Nearest = ${filterModeNearest},`)
  js.push(`  Linear = ${filterModeLinear},`)
  js.push('}')

  js.push('')
  js.push('export enum MipmapMode {')
  js.push(`  None = ${mipmapModeNone},`)
  js.push(`  Nearest = ${mipmapModeNearest},`)
  js.push(`  Linear = ${mipmapModeLinear},`)
  js.push('}')

  js.push('')
  js.push('export enum ClipOp {')
  js.push(`  Difference = ${clipOpDifference},`)
  js.push(`  Intersect = ${clipOpIntersect},`)
  js.push('}')

  js.push('')
  js.push('export enum TextDirection {')
  js.push(`  LTR = ${textDirectionLtr},`)
  js.push(`  RTL = ${textDirectionRtl},`)
  js.push('}')

  js.push('')
  js.push('export enum TextAlign {')
  js.push(`  Left = ${textAlignLeft},`)
  js.push(`  Right = ${textAlignRight},`)
  js.push(`  Center = ${textAlignCenter},`)
  js.push(`  Justify = ${textAlignJustify},`)
  js.push(`  Start = ${textAlignStart},`)
  js.push(`  End = ${textAlignEnd},`)
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