import { Offset } from 'bindings'

import { Shadow, ShadowOptions } from './Shadow'

export interface BoxShadowOptions extends ShadowOptions {
	spreadRadius?: number
}

export class BoxShadow extends Shadow {
	public readonly spreadRadius: number

	constructor(options?: BoxShadowOptions)
	constructor(x: number, y: number, blur: number, spread?: number)
	constructor(a: BoxShadowOptions | number = {}, b?: number, c?: number, d?: number) {
		// Old signature: (x,y,blur,spread)
		if (typeof a === 'number' && typeof b === 'number' && typeof c === 'number') {
			super(a, b, c, d)
			this.spreadRadius = d ?? 0
			return
		}

		const opt = (a ?? {}) as BoxShadowOptions
		super({
			color: opt.color,
			offset: opt.offset,
			blurRadius: opt.blurRadius,
		})
		this.spreadRadius = opt.spreadRadius ?? 0
	}

	override get spread(): number {
		return this.spreadRadius
	}

	override scale(factor: number): BoxShadow {
		return new BoxShadow({
			color: this.color,
			offset: new Offset(this.offset.dx * factor, this.offset.dy * factor),
			blurRadius: this.blurRadius * factor,
			spreadRadius: this.spreadRadius * factor,
		})
	}

	static lerp(a: BoxShadow | null, b: BoxShadow | null, t: number): BoxShadow | null {
		const base = Shadow.lerp(a, b, t)
		if (!base) return null

		const spreadA = a?.spreadRadius ?? 0
		const spreadB = b?.spreadRadius ?? 0
		return new BoxShadow({
			color: base.color,
			offset: base.offset,
			blurRadius: base.blurRadius,
			spreadRadius: spreadA + (spreadB - spreadA) * t,
		})
	}

	eq(other: BoxShadow | null): boolean {
		return (
			other instanceof BoxShadow &&
			other.color === this.color &&
			other.offset.dx === this.offset.dx &&
			other.offset.dy === this.offset.dy &&
			other.blurRadius === this.blurRadius &&
			other.spreadRadius === this.spreadRadius
		)
	}

	notEq(other: BoxShadow | null): boolean {
		return !this.eq(other)
	}
}
