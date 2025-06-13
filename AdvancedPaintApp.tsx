"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "./components/ColorPicker"
import { ToolPanel } from "./components/ToolPanel"
import { MenuBar } from "./components/MenuBar"
import { useHistory } from "./hooks/useHistory"
import { drawRectangle, drawCircle, floodFill, getColorAtPoint, rgbToHex } from "./utils/canvasUtils"
import { PortfolioPopup } from "./components/PortfolioPopup"

interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

export default function AdvancedPaintApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const windowColorInputRef = useRef<HTMLInputElement>(null)
  const pageBgColorInputRef = useRef<HTMLInputElement>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [tool, setTool] = useState("brush")
  const [brushSize, setBrushSize] = useState(10)
  const [opacity, setOpacity] = useState(1)
  const [customColors, setCustomColors] = useState<string[]>([])

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 })
  const [isShapeDrawing, setIsShapeDrawing] = useState(false)

  const [windowBackgroundColor, setWindowBackgroundColor] = useState("#000000")
  const [pageBackgroundColor, setPageBackgroundColor] = useState("#0D9488")
  const [windowTitle, setWindowTitle] = useState("Paint Avançado - sem título")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(windowTitle)

  const { saveState, undo, redo, canUndo, canRedo } = useHistory()

  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
  const [selectedImageData, setSelectedImageData] = useState<ImageData | null>(null)
  const [isMovingSelection, setIsMovingSelection] = useState(false)
  const [selectionMoveStart, setSelectionMoveStart] = useState({ x: 0, y: 0 })

  const getMainContext = useCallback(() => canvasRef.current?.getContext("2d") || null, [])
  const getOverlayContext = useCallback(() => overlayCanvasRef.current?.getContext("2d") || null, [])

  const saveCanvasState = useCallback(() => {
    const mainCtx = getMainContext()
    if (mainCtx && canvasRef.current) {
      saveState(mainCtx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height))
    }
  }, [saveState, getMainContext])

  const applyOperationToMainCanvas = useCallback(
      (operation: (ctx: CanvasRenderingContext2D) => void) => {
        const mainCtx = getMainContext()
        if (mainCtx) {
          operation(mainCtx)
          saveCanvasState()
        }
      },
      [getMainContext, saveCanvasState],
  )

  const handleUndo = useCallback(() => {
    const mainCtx = getMainContext()
    if (mainCtx) {
      const previousState = undo()
      if (previousState) mainCtx.putImageData(previousState, 0, 0)
    }
  }, [undo, getMainContext])

  const handleRedo = useCallback(() => {
    const mainCtx = getMainContext()
    if (mainCtx) {
      const nextState = redo()
      if (nextState) mainCtx.putImageData(nextState, 0, 0)
    }
  }, [redo, getMainContext])

  const handleSave = useCallback(() => {
    if (canvasRef.current) {
      const link = document.createElement("a")
      link.download = `${windowTitle.replace(/\s+/g, "_") || "painting"}.png`
      link.href = canvasRef.current.toDataURL()
      link.click()
    }
  }, [windowTitle])

  const clearSelection = useCallback(
      (save = true) => {
        setIsSelecting(false)
        setSelectionRect(null)
        setSelectedImageData(null)
        setIsMovingSelection(false)
        const overlayCtx = getOverlayContext()
        overlayCtx?.clearRect(0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height)
        if (save) saveCanvasState()
      },
      [getOverlayContext, saveCanvasState],
  )

  const finalizeSelectionMove = useCallback(() => {
    const mainCtx = getMainContext()
    const overlayCtx = getOverlayContext()
    if (mainCtx && overlayCtx && selectedImageData && selectionRect && isMovingSelection) {
      mainCtx.fillStyle = "#FFFFFF"
      mainCtx.fillRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height)
      mainCtx.putImageData(selectedImageData, currentPos.x, currentPos.y)
      saveCanvasState()
    }
    clearSelection(false)
    overlayCtx?.clearRect(0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height)
  }, [
    getMainContext,
    getOverlayContext,
    selectedImageData,
    selectionRect,
    currentPos,
    saveCanvasState,
    isMovingSelection,
    clearSelection,
  ])

  useEffect(() => {
    const context = getMainContext()
    if (context && canvasRef.current) {
      context.fillStyle = "#FFFFFF"
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      saveState(context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height))
    }
  }, [saveState, getMainContext])

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
          case "o":
            e.preventDefault()
            const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement | null
            if (fileInput && fileInput.parentElement?.classList.contains("hidden")) {
              const clickableParent = fileInput.closest("button") || fileInput.closest('[role="menuitem"]')
              ;(clickableParent as HTMLElement)?.click()
            } else {
              ;(document.getElementById("file-open-trigger-in-menubar") as HTMLElement)?.click()
            }
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
        case "i":
          setTool("eyedropper")
          break
        case "p":
          setTool("spray")
          break
        case "v":
          if (!e.ctrlKey && !e.metaKey) {
            setTool("select")
            if (isMovingSelection || selectionRect) finalizeSelectionMove()
          }
          break
        case "escape":
          if (tool === "select" && (selectionRect || isSelecting || isMovingSelection)) {
            clearSelection()
          }
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    isEditingTitle,
    tempTitle,
    windowTitle,
    handleUndo,
    handleRedo,
    handleSave,
    tool,
    selectionRect,
    isSelecting,
    isMovingSelection,
    finalizeSelectionMove,
    clearSelection,
  ])

  useEffect(() => {
    if (tool !== "select" && (selectionRect || isMovingSelection)) {
      finalizeSelectionMove()
    }
  }, [tool, selectionRect, isMovingSelection, finalizeSelectionMove])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mainCtx = getMainContext()
    const overlayCtx = getOverlayContext()
    if (!mainCtx || !canvasRef.current || !overlayCtx || !overlayCanvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentPos({ x, y })
    setStartPos({ x, y })

    if (tool === "select") {
      if (
          selectionRect &&
          x >= selectionRect.x &&
          x <= selectionRect.x + selectionRect.width &&
          y >= selectionRect.y &&
          y <= selectionRect.y + selectionRect.height
      ) {
        if (!selectedImageData) {
          const imageData = mainCtx.getImageData(
              selectionRect.x,
              selectionRect.y,
              selectionRect.width,
              selectionRect.height,
          )
          setSelectedImageData(imageData)
        }
        setIsMovingSelection(true)
        setSelectionMoveStart({ x: x - selectionRect.x, y: y - selectionRect.y })
      } else {
        if (selectionRect || isMovingSelection) finalizeSelectionMove()
        setIsSelecting(true)
      }
      return
    }

    if (tool === "text") {
      const text = prompt("Digite o texto:")
      if (text) {
        applyOperationToMainCanvas((ctx) => {
          ctx.font = `${brushSize * 2}px Arial`
          ctx.fillStyle = color
          ctx.globalAlpha = opacity
          ctx.fillText(text, x, y)
          ctx.globalAlpha = 1
        })
      }
      return
    }

    if (tool === "eyedropper") {
      const pickedColor = getColorAtPoint(mainCtx, x, y)
      setColor(rgbToHex(pickedColor))
      return
    }
    if (tool === "rectangle" || tool === "circle") {
      setIsShapeDrawing(true)
      return
    }
    if (tool === "bucket") {
      floodFill(mainCtx, Math.floor(x), Math.floor(y), color, canvasRef.current)
      saveCanvasState()
      return
    }

    mainCtx.globalAlpha = opacity
    mainCtx.beginPath()
    mainCtx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mainCtx = getMainContext()
    const overlayCtx = getOverlayContext()
    if (!mainCtx || !canvasRef.current || !overlayCtx || !overlayCanvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)

    if (tool === "select") {
      if (isSelecting) {
        const width = x - startPos.x
        const height = y - startPos.y
        overlayCtx.setLineDash([4, 2])
        overlayCtx.strokeStyle = "rgba(0,0,0,0.8)"
        overlayCtx.strokeRect(startPos.x, startPos.y, width, height)
        overlayCtx.setLineDash([])
        setCurrentPos({ x, y })
      } else if (isMovingSelection && selectedImageData && selectionRect) {
        const newX = x - selectionMoveStart.x
        const newY = y - selectionMoveStart.y
        overlayCtx.putImageData(selectedImageData, newX, newY)
        overlayCtx.setLineDash([4, 2])
        overlayCtx.strokeStyle = "rgba(0,0,0,0.8)"
        overlayCtx.strokeRect(newX, newY, selectionRect.width, selectionRect.height)
        overlayCtx.setLineDash([])
        setCurrentPos({ x: newX, y: newY })
      } else if (selectionRect) {
        overlayCtx.setLineDash([4, 2])
        overlayCtx.strokeStyle = "rgba(0,0,0,0.8)"
        overlayCtx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height)
        overlayCtx.setLineDash([])
      }
      return
    }

    setCurrentPos({ x, y })

    if (isShapeDrawing) {
      overlayCtx.globalAlpha = opacity
      if (tool === "rectangle") drawRectangle(overlayCtx, startPos.x, startPos.y, x, y, color)
      else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
        drawCircle(overlayCtx, startPos.x, startPos.y, radius, color)
      }
      return
    }

    if (!isDrawing) return

    mainCtx.lineTo(x, y)
    if (tool === "eraser") {
      mainCtx.globalCompositeOperation = "destination-out"
      mainCtx.lineWidth = brushSize * 2
    } else if (tool === "spray") {
      mainCtx.globalCompositeOperation = "source-over"
      for (let i = 0; i < 20; i++) {
        const offsetX = (Math.random() - 0.5) * brushSize * 2
        const offsetY = (Math.random() - 0.5) * brushSize * 2
        mainCtx.fillStyle = color
        mainCtx.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
      return
    } else {
      mainCtx.globalCompositeOperation = "source-over"
      mainCtx.strokeStyle = color
      mainCtx.lineWidth = brushSize
    }
    mainCtx.lineCap = "round"
    mainCtx.stroke()
  }

  const stopDrawing = () => {
    const mainCtx = getMainContext()
    const overlayCtx = getOverlayContext()
    if (!mainCtx || !overlayCtx || !overlayCanvasRef.current) return

    if (tool === "select") {
      if (isSelecting) {
        const selX = Math.min(startPos.x, currentPos.x)
        const selY = Math.min(startPos.y, currentPos.y)
        const selWidth = Math.abs(currentPos.x - startPos.x)
        const selHeight = Math.abs(currentPos.y - startPos.y)

        if (selWidth > 0 && selHeight > 0) {
          setSelectionRect({ x: selX, y: selY, width: selWidth, height: selHeight })
          const imageData = mainCtx.getImageData(selX, selY, selWidth, selHeight)
          setSelectedImageData(imageData)
        } else {
          clearSelection(false)
        }
        setIsSelecting(false)
      }
      return
    }

    if (isShapeDrawing) {
      mainCtx.globalAlpha = opacity
      if (tool === "rectangle") drawRectangle(mainCtx, startPos.x, startPos.y, currentPos.x, currentPos.y, color)
      else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2))
        drawCircle(mainCtx, startPos.x, startPos.y, radius, color)
      }
      mainCtx.globalAlpha = 1
      saveCanvasState()
    } else if (isDrawing) {
      mainCtx.beginPath()
      saveCanvasState()
    }

    overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
    setIsDrawing(false)
    setIsShapeDrawing(false)
    mainCtx.globalCompositeOperation = "source-over"
  }

  const handleLoad = (file: File) => {
    const mainCtx = getMainContext()
    if (!mainCtx || !canvasRef.current) return
    const img = new Image()
    img.onload = () => {
      mainCtx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
      mainCtx.fillStyle = "#FFFFFF"
      mainCtx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
      mainCtx.drawImage(img, 0, 0)
      saveCanvasState()
      setWindowTitle(`Paint Avançado - ${file.name}`)
      setTempTitle(`Paint Avançado - ${file.name}`)
    }
    img.src = URL.createObjectURL(file)
  }

  const handleClear = () => {
    const mainCtx = getMainContext()
    if (mainCtx && canvasRef.current) {
      mainCtx.fillStyle = "#FFFFFF"
      mainCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      saveCanvasState()
      setWindowTitle("Paint Avançado - sem título")
      setTempTitle("Paint Avançado - sem título")
      clearSelection(false)
    }
  }

  const addCustomColor = (newColor: string) => {
    if (!customColors.includes(newColor)) {
      setCustomColors((prev) => [...prev.slice(-7), newColor])
    }
  }

  const viewBlack = () => {
    const mainCtx = getMainContext()
    if (mainCtx && canvasRef.current) {
      const currentState = mainCtx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
      const imageData = mainCtx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = avg < 128 ? 0 : 255
        data[i + 1] = avg < 128 ? 0 : 255
        data[i + 2] = avg < 128 ? 0 : 255
      }
      mainCtx.putImageData(imageData, 0, 0)
      setTimeout(() => {
        mainCtx.putImageData(currentState, 0, 0)
      }, 2000)
    }
  }

  const startDraggingWindow = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditingTitle) return
    setDragging(true)
    setPosition({
      x: e.clientX - (containerRef.current?.offsetLeft || 0),
      y: e.clientY - (containerRef.current?.offsetTop || 0),
    })
  }
  const onDragWindow = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging) {
      const left = e.clientX - position.x
      const top = e.clientY - position.y
      if (containerRef.current) {
        containerRef.current.style.left = `${left}px`
        containerRef.current.style.top = `${top}px`
      }
    }
  }
  const stopDraggingWindow = () => setDragging(false)

  const handleTitleDoubleClick = () => {
    setTempTitle(windowTitle)
    setIsEditingTitle(true)
  }
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setTempTitle(e.target.value)
  const handleTitleBlur = () => {
    setWindowTitle(tempTitle)
    setIsEditingTitle(false)
  }
  const openWindowColorPicker = () => windowColorInputRef.current?.click()
  const openPageBackgroundColorPicker = () => pageBgColorInputRef.current?.click()

  return (
      <>
        <input
            type="color"
            ref={pageBgColorInputRef}
            className="hidden"
            value={pageBackgroundColor}
            onChange={(e) => setPageBackgroundColor(e.target.value)}
        />
        <div className="h-screen overflow-hidden select-none" style={{ backgroundColor: pageBackgroundColor }}>
          <div
              ref={containerRef}
              className="absolute border-2 border-white shadow-lg"
              style={{
                width: "900px",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: windowBackgroundColor,
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
                onMouseDown={startDraggingWindow}
                onMouseMove={onDragWindow}
                onMouseUp={stopDraggingWindow}
                onMouseLeave={stopDraggingWindow}
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
                onOpenWindowColorPicker={openWindowColorPicker}
                onOpenPageBackgroundColorPicker={openPageBackgroundColorPicker}
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
                  style={{ width: "800px", height: "500px", overflow: "hidden" }}
              >
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={800}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    className="absolute top-0 left-0 cursor-crosshair bg-white"
                />
                <canvas
                    ref={overlayCanvasRef}
                    width={1200}
                    height={800}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{ cursor: tool === "select" && (isMovingSelection || selectionRect) ? "move" : "crosshair" }}
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
              Ferramenta: {tool} | Tam: {brushSize}px | Opac: {Math.round(opacity * 100)}%
            </span>
              <span>Ctrl+O: Abrir | Ctrl+S: Salvar | Ctrl+Z: Desfazer | V: Seleção</span>
            </div>
          </div>
        </div>
        <PortfolioPopup />
      </>
  )
}