import * as path from 'path'
import * as fs from 'fs/promises'
import { CanvasKitApi } from '../src/CanvasKitApi'

function tryInvoke(name: string, fallback: number): number {
  try {
    return CanvasKitApi.invoke(name)
  } catch {
    return fallback
  }
}

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

  // NOTE: StrokeCap/StrokeJoin might be missing in older cheap wasm builds.
  // Use stable SkPaint ordering (0..2) as a fallback.
  const strokeCapButt = tryInvoke('SkStrokeCap_Butt', 0)
  const strokeCapRound = tryInvoke('SkStrokeCap_Round', 1)
  const strokeCapSquare = tryInvoke('SkStrokeCap_Square', 2)

  const strokeJoinMiter = tryInvoke('SkStrokeJoin_Miter', 0)
  const strokeJoinRound = tryInvoke('SkStrokeJoin_Round', 1)
  const strokeJoinBevel = tryInvoke('SkStrokeJoin_Bevel', 2)

  // BlurStyle (SkBlurStyle)
  const blurStyleNormal = tryInvoke('SkBlurStyle_Normal', 0)
  const blurStyleSolid = tryInvoke('SkBlurStyle_Solid', 1)
  const blurStyleOuter = tryInvoke('SkBlurStyle_Outer', 2)
  const blurStyleInner = tryInvoke('SkBlurStyle_Inner', 3)

  const filterModeNearest = CanvasKitApi.invoke('SkFilterMode_Nearest')
  const filterModeLinear = CanvasKitApi.invoke('SkFilterMode_Linear')

  const mipmapModeNone = CanvasKitApi.invoke('SkMipmapMode_None')
  const mipmapModeNearest = CanvasKitApi.invoke('SkMipmapMode_Nearest')
  const mipmapModeLinear = CanvasKitApi.invoke('SkMipmapMode_Linear')

  // NOTE: TileMode 在部分 cheap wasm 版本里可能还没有导出；这里做兼容回退。
  const tileModeClamp = tryInvoke('SkTileMode_Clamp', 0)
  const tileModeRepeat = tryInvoke('SkTileMode_Repeat', 1)
  const tileModeMirror = tryInvoke('SkTileMode_Mirror', 2)
  const tileModeDecal = tryInvoke('SkTileMode_Decal', 3)

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
  js.push(`export enum FilterQuality {`)
  js.push(`  None = 0,`)
  js.push(`  Low = 1,`)
  js.push(`  Medium = 2,`)
  js.push(`  High = 3,`)
  js.push(`}`)

  js.push('')
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
  js.push('export enum StrokeCap {')
  js.push(`  Butt = ${strokeCapButt},`)
  js.push(`  Round = ${strokeCapRound},`)
  js.push(`  Square = ${strokeCapSquare},`)
  js.push('}')

  js.push('')
  js.push('export enum StrokeJoin {')
  js.push(`  Miter = ${strokeJoinMiter},`)
  js.push(`  Round = ${strokeJoinRound},`)
  js.push(`  Bevel = ${strokeJoinBevel},`)
  js.push('}')

  js.push('')
  js.push('export enum BlurStyle {')
  js.push(`  Normal = ${blurStyleNormal},`)
  js.push(`  Solid = ${blurStyleSolid},`)
  js.push(`  Outer = ${blurStyleOuter},`)
  js.push(`  Inner = ${blurStyleInner},`)
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
  js.push('export enum TileMode {')
  js.push(`  Clamp = ${tileModeClamp},`)
  js.push(`  Repeat = ${tileModeRepeat},`)
  js.push(`  Mirror = ${tileModeMirror},`)
  js.push(`  Decal = ${tileModeDecal},`)
  js.push('}')

  js.push('')
  js.push('export enum ClipOp {')
  js.push(`  Difference = ${clipOpDifference},`)
  js.push(`  Intersect = ${clipOpIntersect},`)
  js.push('}')

  // Clip is a framework-level enum (not a Sk* wasm-exported enum).
  // Keep numeric values aligned with Flutter/engine conventions.
  js.push('')
  js.push('export enum Clip {')
  js.push('  None = 0,')
  js.push('  HardEdge = 1,')
  js.push('  AntiAlias = 2,')
  js.push('  AntiAliasWithSaveLayer = 3,')
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

  // BlendMode: prefer C++ exported SkBlendMode_* constants when available,
  // otherwise fall back to the hard-coded SkBlendMode ordering (0..28).
  js.push('')
  js.push('export enum BlendMode {')
  const blendEntries: Array<[string, string, number]> = [
    ['Clear', 'SkBlendMode_Clear', 0],
    ['Src', 'SkBlendMode_Src', 1],
    ['Dst', 'SkBlendMode_Dst', 2],
    ['SrcOver', 'SkBlendMode_SrcOver', 3],
    ['DstOver', 'SkBlendMode_DstOver', 4],
    ['SrcIn', 'SkBlendMode_SrcIn', 5],
    ['DstIn', 'SkBlendMode_DstIn', 6],
    ['SrcOut', 'SkBlendMode_SrcOut', 7],
    ['DstOut', 'SkBlendMode_DstOut', 8],
    ['SrcATop', 'SkBlendMode_SrcATop', 9],
    ['DstATop', 'SkBlendMode_DstATop', 10],
    ['Xor', 'SkBlendMode_Xor', 11],
    ['Plus', 'SkBlendMode_Plus', 12],
    ['Modulate', 'SkBlendMode_Modulate', 13],
    ['Screen', 'SkBlendMode_Screen', 14],
    ['Overlay', 'SkBlendMode_Overlay', 15],
    ['Darken', 'SkBlendMode_Darken', 16],
    ['Lighten', 'SkBlendMode_Lighten', 17],
    ['ColorDodge', 'SkBlendMode_ColorDodge', 18],
    ['ColorBurn', 'SkBlendMode_ColorBurn', 19],
    ['HardLight', 'SkBlendMode_HardLight', 20],
    ['SoftLight', 'SkBlendMode_SoftLight', 21],
    ['Difference', 'SkBlendMode_Difference', 22],
    ['Exclusion', 'SkBlendMode_Exclusion', 23],
    ['Multiply', 'SkBlendMode_Multiply', 24],
    ['Hue', 'SkBlendMode_Hue', 25],
    ['Saturation', 'SkBlendMode_Saturation', 26],
    ['Color', 'SkBlendMode_Color', 27],
    ['Luminosity', 'SkBlendMode_Luminosity', 28],
  ]

  for (const [label, exportName, fallback] of blendEntries) {
    const val = tryInvoke(exportName, fallback)
    js.push(`  ${label} = ${val},`)
  }

  js.push('}')

  await fs.writeFile(
    path.resolve(process.cwd(), 'src/enums.ts'),
    js.join('\n'))
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})