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
  const windowColorInputRef = useRef<HTMLInputElement>(null) // Ref para o input de cor da janela

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

  const [windowBackgroundColor, setWindowBackgroundColor] = useState("#000000") // Padrão preto
  const [windowTitle, setWindowTitle] = useState("Paint Avançado - sem título")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(windowTitle)

  const { saveState, undo, redo, canUndo, canRedo } = useHistory()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      context.fillStyle = "#FFFFFF" // Fundo do canvas sempre branco
      context.fillRect(0, 0, canvas.width, canvas.height)
      saveState(context.getImageData(0, 0, canvas.width, canvas.height))
    }
  }, [saveState])

  const handleUndo = useCallback(() => {
    // Envolver com useCallback
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      const previousState = undo()
      if (previousState) context.putImageData(previousState, 0, 0)
    }
  }, [undo])

  const handleRedo = useCallback(() => {
    // Envolver com useCallback
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      const nextState = redo()
      if (nextState) context.putImageData(nextState, 0, 0)
    }
  }, [redo])

  const handleSave = useCallback(() => {
    // Envolver com useCallback
    const canvas = canvasRef.current
    if (canvas) {
      const link = document.createElement("a")
      link.download = `${windowTitle.replace(/\s+/g, "_") || "painting"}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }, [windowTitle])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingTitle) {
        if (e.key === "Enter") {
          setWindowTitle(tempTitle)
          setIsEditingTitle(false)
        } else if (e.key === "Escape") {
          setTempTitle(windowTitle)
          setIsEditingTitle(false)
        }
        return
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) handleRedo()
            else handleUndo()
            break
          case "y":
            e.preventDefault()
            handleRedo()
            break
          case "s":
            e.preventDefault()
            handleSave()
            break
          case "o": // Atalho para Abrir
            e.preventDefault()
            document.getElementById("file-open-trigger")?.click() // Simula clique no item do menu
            break
        }
      }

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
  }, [isEditingTitle, tempTitle, windowTitle, handleUndo, handleRedo, handleSave]) // Adicionar dependências

  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      saveState(context.getImageData(0, 0, canvas.width, canvas.height))
    }
  }, [saveState])

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
      setColor(rgbToHex(pickedColor))
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
      overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
      overlayContext.globalAlpha = opacity
      if (tool === "rectangle") drawRectangle(overlayContext, startPos.x, startPos.y, x, y, color)
      else if (tool === "circle") {
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
      const imageData = overlayContext.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height)
      context.putImageData(imageData, 0, 0)
      overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
      setIsShapeDrawing(false)
      saveCanvasState()
    } else if (isDrawing) saveCanvasState()
    setIsDrawing(false)
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
      setWindowTitle(`Paint Avançado - ${file.name}`)
      setTempTitle(`Paint Avançado - ${file.name}`)
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
      setWindowTitle("Paint Avançado - sem título")
      setTempTitle("Paint Avançado - sem título")
    }
  }

  const addCustomColor = (newColor: string) => {
    if (!customColors.includes(newColor)) {
      setCustomColors((prev) => [...prev.slice(-7), newColor])
    }
  }

  const viewBlack = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (context && canvas) {
      const currentState = context.getImageData(0, 0, canvas.width, canvas.height)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = avg < 128 ? 0 : 255
        data[i + 1] = avg < 128 ? 0 : 255
        data[i + 2] = avg < 128 ? 0 : 255
      }
      context.putImageData(imageData, 0, 0)
      setTimeout(() => {
        context.putImageData(currentState, 0, 0)
      }, 2000)
    }
  }

  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditingTitle) return // Não arrastar se estiver editando título
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
  const stopDragging = () => setDragging(false)

  const handleTitleDoubleClick = () => {
    setTempTitle(windowTitle)
    setIsEditingTitle(true)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempTitle(e.target.value)
  }

  const handleTitleBlur = () => {
    setWindowTitle(tempTitle)
    setIsEditingTitle(false)
  }

  const openWindowColorPicker = () => {
    windowColorInputRef.current?.click()
  }

  return (
      <div className="h-screen bg-teal-600 overflow-hidden">
        <div
            ref={containerRef}
            className="absolute border-2 border-white shadow-lg"
            style={{
              width: "900px",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: windowBackgroundColor, // Aplicar cor de fundo da janela
            }}
        >
          <input
              type="color"
              ref={windowColorInputRef}
              className="hidden"
              value={windowBackgroundColor}
              onChange={(e) => setWindowBackgroundColor(e.target.value)}
          />
          <div
              className="bg-blue-900 text-white px-2 py-1 flex justify-between items-center cursor-move"
              onMouseDown={startDragging}
              onMouseMove={onDrag}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
          >
            {isEditingTitle ? (
                <input
                    type="text"
                    value={tempTitle}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleBlur()
                      if (e.key === "Escape") {
                        setTempTitle(windowTitle)
                        setIsEditingTitle(false)
                      }
                    }}
                    className="bg-blue-800 text-white px-1 flex-grow"
                    autoFocus
                />
            ) : (
                <span onDoubleClick={handleTitleDoubleClick} className="flex-grow">
              {windowTitle}
            </span>
            )}
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

          <MenuBar
              onSave={handleSave}
              onLoad={handleLoad}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              canUndo={canUndo}
              canRedo={canRedo}
              onViewBlack={viewBlack}
              onOpenWindowColorPicker={openWindowColorPicker} // Passar a nova função
          />

          <div className="flex">
            <ToolPanel
                selectedTool={tool}
                onToolChange={setTool}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                opacity={opacity}
                onOpacityChange={setOpacity}
            />
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
                  className="absolute top-0 left-0 cursor-crosshair bg-white" // Canvas sempre com fundo branco
              />
              <canvas
                  ref={overlayCanvasRef}
                  width={1200}
                  height={800}
                  className="absolute top-0 left-0 pointer-events-none"
              />
            </div>
          </div>

          <ColorPicker
              selectedColor={color}
              onColorChange={setColor}
              customColors={customColors}
              onAddCustomColor={addCustomColor}
          />

          <div className="bg-gray-300 px-2 py-1 text-sm border-t border-gray-400 flex justify-between">
          <span>
            Ferramenta: {tool} | Tamanho: {brushSize}px | Opacidade: {Math.round(opacity * 100)}%
          </span>
            <span>Ctrl+O: Abrir | Ctrl+S: Salvar | Ctrl+Z: Desfazer</span>
          </div>
        </div>
      </div>
  )
}