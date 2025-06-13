"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "./components/ColorPicker"
import { ToolPanel } from "./components/ToolPanel"
import { MenuBar } from "./components/MenuBar"
import { useHistory } from "./hooks/useHistory"
import { drawRectangle, drawCircle, floodFill, getColorAtPoint, rgbToHex } from "./utils/canvasUtils"

export default function AdvancedPaintApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [tool, setTool] = useState("brush")
  const [brushSize, setBrushSize] = useState(2)
  const [opacity, setOpacity] = useState(1)
  const [customColors, setCustomColors] = useState<string[]>([])

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [isShapeDrawing, setIsShapeDrawing] = useState(false)

  const { saveState, undo, redo, canUndo, canRedo } = useHistory()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      context.fillStyle = "#FFFFFF"
      context.fillRect(0, 0, canvas.width, canvas.height)
      saveState(context.getImageData(0, 0, canvas.width, canvas.height))
    }
  }, [saveState])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              handleRedo()
            } else {
              handleUndo()
            }
            break
          case "y":
            e.preventDefault()
            handleRedo()
            break
          case "s":
            e.preventDefault()
            handleSave()
            break
        }
      }

      // Tool shortcuts
      switch (e.key.toLowerCase()) {
        case "b":
          setTool("brush")
          break
        case "e":
          setTool("eraser")
          break
        case "r":
          setTool("rectangle")
          break
        case "c":
          setTool("circle")
          break
        case "t":
          setTool("text")
          break
        case "s":
          if (!e.ctrlKey && !e.metaKey) setTool("select")
          break
        case "i":
          setTool("eyedropper")
          break
        case "p":
          setTool("spray")
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      saveState(context.getImageData(0, 0, canvas.width, canvas.height))
    }
  }, [saveState])

  const handleUndo = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      const previousState = undo()
      if (previousState) {
        context.putImageData(previousState, 0, 0)
      }
    }
  }

  const handleRedo = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      const nextState = redo()
      if (nextState) {
        context.putImageData(nextState, 0, 0)
      }
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!context || !canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setStartPos({ x, y })

    if (tool === "eyedropper") {
      const pickedColor = getColorAtPoint(context, x, y)
      const hexColor = rgbToHex(pickedColor)
      setColor(hexColor)
      return
    }

    if (tool === "rectangle" || tool === "circle") {
      setIsShapeDrawing(true)
      return
    }

    if (tool === "bucket") {
      floodFill(context, Math.floor(x), Math.floor(y), color, canvas)
      saveCanvasState()
      return
    }

    context.globalAlpha = opacity
    context.beginPath()
    context.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    const context = canvas?.getContext("2d")
    const overlayContext = overlayCanvas?.getContext("2d")

    if (!context || !canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isShapeDrawing && overlayContext && overlayCanvas) {
      // Clear overlay and draw preview
      overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
      overlayContext.globalAlpha = opacity

      if (tool === "rectangle") {
        drawRectangle(overlayContext, startPos.x, startPos.y, x, y, color)
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
        drawCircle(overlayContext, startPos.x, startPos.y, radius, color)
      }
      return
    }

    if (!isDrawing) return

    context.globalAlpha = opacity
    context.lineTo(x, y)

    if (tool === "eraser") {
      context.globalCompositeOperation = "destination-out"
      context.lineWidth = brushSize * 2
    } else if (tool === "spray") {
      // Spray effect
      for (let i = 0; i < 20; i++) {
        const offsetX = (Math.random() - 0.5) * brushSize * 2
        const offsetY = (Math.random() - 0.5) * brushSize * 2
        context.fillStyle = color
        context.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
      return
    } else {
      context.globalCompositeOperation = "source-over"
      context.strokeStyle = color
      context.lineWidth = brushSize
    }

    context.lineCap = "round"
    context.stroke()
  }

  const stopDrawing = () => {
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    const context = canvas?.getContext("2d")
    const overlayContext = overlayCanvas?.getContext("2d")

    if (isShapeDrawing && context && overlayContext && overlayCanvas) {
      // Draw the final shape on main canvas
      const imageData = overlayContext.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height)
      context.putImageData(imageData, 0, 0)
      overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
      setIsShapeDrawing(false)
      saveCanvasState()
    } else if (isDrawing) {
      saveCanvasState()
    }

    setIsDrawing(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const link = document.createElement("a")
      link.download = "painting.png"
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  const handleLoad = (file: File) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!context || !canvas) return

    const img = new Image()
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = "#FFFFFF"
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(img, 0, 0)
      saveCanvasState()
    }
    img.src = URL.createObjectURL(file)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      context.fillStyle = "#FFFFFF"
      context.fillRect(0, 0, canvas.width, canvas.height)
      saveCanvasState()
    }
  }

  const addCustomColor = (newColor: string) => {
    if (!customColors.includes(newColor)) {
      setCustomColors((prev) => [...prev.slice(-7), newColor])
    }
  }

  // Adicione esta função após a função addCustomColor
  const viewBlack = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      // Salvar o estado atual antes de aplicar o filtro
      const currentState = context.getImageData(0, 0, canvas.width, canvas.height)

      // Aplicar filtro preto
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = avg < 128 ? 0 : 255 // R
        data[i + 1] = avg < 128 ? 0 : 255 // G
        data[i + 2] = avg < 128 ? 0 : 255 // B
      }

      context.putImageData(imageData, 0, 0)

      // Restaurar após 2 segundos
      setTimeout(() => {
        context.putImageData(currentState, 0, 0)
      }, 2000)
    }
  }

  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true)
    setPosition({
      x: e.clientX - (containerRef.current?.offsetLeft || 0),
      y: e.clientY - (containerRef.current?.offsetTop || 0),
    })
  }

  const onDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging) {
      const left = e.clientX - position.x
      const top = e.clientY - position.y
      if (containerRef.current) {
        containerRef.current.style.left = `${left}px`
        containerRef.current.style.top = `${top}px`
      }
    }
  }

  const stopDragging = () => {
    setDragging(false)
  }

  return (
    <div className="h-screen bg-teal-600 overflow-hidden">
      <div
        ref={containerRef}
        className="absolute bg-gray-200 border-2 border-white shadow-lg"
        style={{ width: "900px", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        {/* Title Bar */}
        <div
          className="bg-blue-900 text-white px-2 py-1 flex justify-between items-center cursor-move"
          onMouseDown={startDragging}
          onMouseMove={onDrag}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
          <span>Paint Avançado - sem título</span>
          <div className="flex gap-1">
            <Button variant="ghost" className="h-5 w-5 p-0 min-w-0 text-white hover:bg-blue-700">
              _
            </Button>
            <Button variant="ghost" className="h-5 w-5 p-0 min-w-0 text-white hover:bg-blue-700">
              □
            </Button>
            <Button variant="ghost" className="h-5 w-5 p-0 min-w-0 text-white hover:bg-blue-700">
              ×
            </Button>
          </div>
        </div>

        {/* Menu Bar */}
        <MenuBar
          onSave={handleSave}
          onLoad={handleLoad}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          canUndo={canUndo}
          canRedo={canRedo}
          onViewBlack={viewBlack}
        />

        <div className="flex">
          {/* Tool Panel */}
          <ToolPanel
            selectedTool={tool}
            onToolChange={setTool}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            opacity={opacity}
            onOpacityChange={setOpacity}
          />

          {/* Canvas Area */}
          <div
            className="flex-grow relative border border-gray-400"
            style={{ width: "800px", height: "500px", overflow: "auto" }}
          >
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              className="absolute top-0 left-0 cursor-crosshair"
            />
            <canvas
              ref={overlayCanvasRef}
              width={1200}
              height={800}
              className="absolute top-0 left-0 pointer-events-none"
            />
          </div>
        </div>

        {/* Color Picker */}
        <ColorPicker
          selectedColor={color}
          onColorChange={setColor}
          customColors={customColors}
          onAddCustomColor={addCustomColor}
        />

        {/* Status Bar */}
        <div className="bg-gray-300 px-2 py-1 text-sm border-t border-gray-400 flex justify-between">
          <span>
            Ferramenta: {tool} | Tamanho: {brushSize}px | Opacidade: {Math.round(opacity * 100)}%
          </span>
          <span>Use atalhos: B(pincel), E(borracha), R(retângulo), C(círculo), Ctrl+Z(desfazer)</span>
        </div>
      </div>
    </div>
  )
}
