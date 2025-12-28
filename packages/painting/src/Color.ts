export class Color {
  static fromARGB(a: number, r: number, g: number, b: number): number {
    return (
      ((a & 0xff) << 24) |
      ((r & 0xff) << 16) |
      ((g & 0xff) << 8) |
      ((b & 0xff) << 0)
    ) >>> 0
  }

  static fromRGBO(r: number, g: number, b: number, opacity: number): number {
    return Color.fromARGB(Math.round(opacity * 255), r, g, b)
  }

  static fromRGB(r: number, g: number, b: number, a: number = 255): number {
    return Color.fromARGB(a, r, g, b)
  }

  static getAlpha(color: number): number {
    return (color >>> 24) & 0xff
  }

  static getRed(color: number): number {
    return (color >>> 16) & 0xff
  }

  static getGreen(color: number): number {
    return (color >>> 8) & 0xff
  }

  static getBlue(color: number): number {
    return color & 0xff
  }

  static withAlpha(color: number, alpha: number): number {
    return (color & 0x00ffffff) | ((alpha & 0xff) << 24)
  }

  static lerp(a: number, b: number, t: number): number {
    const alpha = Math.round(Color.getAlpha(a) + (Color.getAlpha(b) - Color.getAlpha(a)) * t)
    const red = Math.round(Color.getRed(a) + (Color.getRed(b) - Color.getRed(a)) * t)
    const green = Math.round(Color.getGreen(a) + (Color.getGreen(b) - Color.getGreen(a)) * t)
    const blue = Math.round(Color.getBlue(a) + (Color.getBlue(b) - Color.getBlue(a)) * t)
    return Color.fromRGB(red, green, blue, alpha)
  }
}
