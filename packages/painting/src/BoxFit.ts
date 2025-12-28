import { Size } from 'geometry'

export enum BoxFit {
  Fill = 'fill',
  Contain = 'contain',
  Cover = 'cover',
  FitWidth = 'fitWidth',
  FitHeight = 'fitHeight',
  None = 'none',
  ScaleDown = 'scaleDown',
}

export interface FittedSizes {
  source: Size
  destination: Size
}

export function applyBoxFit(fit: BoxFit, inputSize: Size, outputSize: Size): FittedSizes {
  if (inputSize.isEmpty() || outputSize.isEmpty()) {
    return { source: new Size(0, 0), destination: new Size(0, 0) }
  }

  switch (fit) {
    case BoxFit.Fill:
      return { source: inputSize, destination: outputSize }

    case BoxFit.None: {
      const destination = new Size(
        Math.min(inputSize.width, outputSize.width),
        Math.min(inputSize.height, outputSize.height),
      )
      return { source: destination, destination }
    }

    case BoxFit.Contain:
    case BoxFit.Cover:
    case BoxFit.FitWidth:
    case BoxFit.FitHeight: {
      const inputAspect = inputSize.width / inputSize.height
      const outputAspect = outputSize.width / outputSize.height

      let source = inputSize
      let destination = outputSize

      const isCover = fit === BoxFit.Cover
      const fitWidth = fit === BoxFit.FitWidth
      const fitHeight = fit === BoxFit.FitHeight

      if (fitWidth || (!fitHeight && (isCover ? outputAspect > inputAspect : outputAspect < inputAspect))) {
        destination = new Size(outputSize.width, outputSize.width / inputAspect)
      } else {
        destination = new Size(outputSize.height * inputAspect, outputSize.height)
      }

      if (isCover) {
        if (destination.width > outputSize.width) {
          const cropWidth = inputSize.height * outputAspect
          source = new Size(cropWidth, inputSize.height)
        } else if (destination.height > outputSize.height) {
          const cropHeight = inputSize.width / outputAspect
          source = new Size(inputSize.width, cropHeight)
        }
        destination = outputSize
      }

      return { source, destination }
    }

    case BoxFit.ScaleDown: {
      const contained = applyBoxFit(BoxFit.Contain, inputSize, outputSize)
      if (contained.destination.width >= inputSize.width && contained.destination.height >= inputSize.height) {
        return { source: inputSize, destination: inputSize }
      }
      return contained
    }
  }
}
