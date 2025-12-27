import { BorderSide } from './Border'

export class BoxBorder {
  constructor(
    public readonly top: BorderSide = BorderSide.NONE,
    public readonly right: BorderSide = BorderSide.NONE,
    public readonly bottom: BorderSide = BorderSide.NONE,
    public readonly left: BorderSide = BorderSide.NONE,
  ) {}
}
