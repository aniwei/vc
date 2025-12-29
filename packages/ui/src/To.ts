import { Axis } from './Flex'
import { AxisDirection, ScrollDirection } from './Viewport'

export function axisDirectionToAxis(axisDirection: AxisDirection): Axis {
  switch (axisDirection) {
    case AxisDirection.Up:
    case AxisDirection.Down:
      return Axis.Vertical
    case AxisDirection.Left:
    case AxisDirection.Right:
      return Axis.Horizontal
  }
}

export function flipScrollDirection(direction: ScrollDirection): ScrollDirection {
  switch (direction) {
    case ScrollDirection.Idle:
      return ScrollDirection.Idle
    case ScrollDirection.Forward:
      return ScrollDirection.Reverse
    case ScrollDirection.Reverse:
      return ScrollDirection.Forward
  }
}

export function flipAxisDirection(axisDirection: AxisDirection): AxisDirection {
  switch (axisDirection) {
    case AxisDirection.Up:
      return AxisDirection.Down
    case AxisDirection.Right:
      return AxisDirection.Left
    case AxisDirection.Down:
      return AxisDirection.Up
    case AxisDirection.Left:
      return AxisDirection.Right
  }
}
