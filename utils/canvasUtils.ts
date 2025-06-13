export function drawRectangle(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string,
    filled = false,
) {
  const width = endX - startX
  const height = endY - startY

  ctx.strokeStyle = color
  ctx.lineWidth = 2

  if (filled) {
    ctx.fillStyle = color
    ctx.fillRect(startX, startY, width, height)
  } else {
    ctx.strokeRect(startX, startY, width, height)
  }
}

export function drawCircle(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    color: string,
    filled = false,
) {
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)

  if (filled) {
    ctx.fillStyle = color
    ctx.fill()
  } else {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

export function floodFill(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    fillColor: string,
    canvas: HTMLCanvasElement,
) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height

  const targetColor = getPixelColor(data, x, y, width)
  const fillColorRgb = hexToRgb(fillColor)

  if (!fillColorRgb || colorsEqual(targetColor, fillColorRgb)) return

  const stack: [number, number][] = [[x, y]]

  while (stack.length > 0) {
    const [currentX, currentY] = stack.pop()!

    if (currentX < 0 || currentX >= width || currentY < 0 || currentY >= height) continue

    const currentColor = getPixelColor(data, currentX, currentY, width)
    if (!colorsEqual(currentColor, targetColor)) continue

    setPixelColor(data, currentX, currentY, width, fillColorRgb)

    stack.push([currentX + 1, currentY])
    stack.push([currentX - 1, currentY])
    stack.push([currentX, currentY + 1])
    stack.push([currentX, currentY - 1])
  }

  ctx.putImageData(imageData, 0, 0)
}

function getPixelColor(data: Uint8ClampedArray, x: number, y: number, width: number) {
  const index = (y * width + x) * 4
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  }
}

function setPixelColor(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    color: { r: number; g: number; b: number },
) {
  const index = (y * width + x) * 4
  data[index] = color.r
  data[index + 1] = color.g
  data[index + 2] = color.b
  data[index + 3] = 255
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
      ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
      : null
}

function colorsEqual(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }) {
  return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b
}

export function getColorAtPoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const imageData = ctx.getImageData(x, y, 1, 1)
  const data = imageData.data
  return `rgb(${data[0]}, ${data[1]}, ${data[2]})`
}

export function rgbToHex(rgb: string): string {
  const result = rgb.match(/\d+/g)
  if (!result) return "#000000"

  const r = Number.parseInt(result[0])
  const g = Number.parseInt(result[1])
  const b = Number.parseInt(result[2])

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
}