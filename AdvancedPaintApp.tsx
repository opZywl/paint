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
import { Maximize2, Minimize2, Minus, X } from "lucide-react"
import { useMobile } from "./hooks/use-mobile"

interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

interface OriginalWindowState {
  width: string
  left: string
  top: string
  transform: string
}

const getContrastYIQUtil = (hexcolor: string): "black" | "white" => {
  if (
      !hexcolor ||
      !hexcolor.startsWith("#") ||
      (hexcolor.length !== 4 && hexcolor.length !== 7 && hexcolor.length !== 9)
  ) {
    return "white"
  }
  let R, G, B
  if (hexcolor.length === 4) {
    R = Number.parseInt(hexcolor[1] + hexcolor[1], 16)
    G = Number.parseInt(hexcolor[2] + hexcolor[2], 16)
    B = Number.parseInt(hexcolor[3] + hexcolor[3], 16)
  } else {
    // #RRGGBB or #RRGGBBAA
    R = Number.parseInt(hexcolor.substring(1, 3), 16)
    G = Number.parseInt(hexcolor.substring(3, 5), 16)
    B = Number.parseInt(hexcolor.substring(5, 7), 16)
  }

  if (isNaN(R) || isNaN(G) || isNaN(B)) {
    return "white" // Default for invalid parsed colors
  }
  const yiq = (R * 299 + G * 587 + B * 114) / 1000
  return yiq >= 128 ? "black" : "white"
}

export default function AdvancedPaintApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const windowColorInputRef = useRef<HTMLInputElement>(null)
  const pageBgColorInputRef = useRef<HTMLInputElement>(null)

  const isMobile = useMobile()

  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [tool, setTool] = useState("brush")
  const [brushSize, setBrushSize] = useState(10)
  const [opacity, setOpacity] = useState(1)
  const [customColors, setCustomColors] = useState<string[]>([])

  const [currentFont, setCurrentFont] = useState("Arial")
  const [currentFontSize, setCurrentFontSize] = useState(16)

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 })
  const [isShapeDrawing, setIsShapeDrawing] = useState(false)

  const [windowBackgroundColor, setWindowBackgroundColor] = useState("#1E3A8A")
  const [pageBackgroundColor, setPageBackgroundColor] = useState("#000000")
  const [windowTitle, setWindowTitle] = useState("Lucas Paint - sem título")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(windowTitle)

  const [isMaximized, setIsMaximized] = useState(false)
  const originalWindowState = useRef<OriginalWindowState | null>(null)

  const { saveState: historySaveState, undo: historyUndo, redo: historyRedo, canUndo, canRedo } = useHistory()

  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
  const [selectedImageData, setSelectedImageData] = useState<ImageData | null>(null)

  const [isMoveMode, setIsMoveMode] = useState(false)
  const [moveStartPos, setMoveStartPos] = useState({ x: 0, y: 0 })
  const [moveImageData, setMoveImageData] = useState<ImageData | null>(null)
  const [isMovingSelection, setIsMovingSelection] = useState(false)
  const [selectionMoveStart, setSelectionMoveStart] = useState({ x: 0, y: 0 })

  const [clipboardData, setClipboardData] = useState<ImageData | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

  const titleBarTextColor = getContrastYIQUtil(windowBackgroundColor)
  const titleBarButtonHoverClass = titleBarTextColor === "white" ? "hover:bg-white/20" : "hover:bg-black/10"

  const getMainContext = useCallback(() => canvasRef.current?.getContext("2d") || null, [])
  const getOverlayContext = useCallback(() => overlayCanvasRef.current?.getContext("2d") || null, [])
  const getScaledPos = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0 || canvas.width === 0 || canvas.height === 0) {
      return { x: 0, y: 0 }
    }
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  const saveCanvasState = useCallback(() => {
    const mainCtx = getMainContext()
    if (mainCtx && canvasRef.current && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
      try {
        historySaveState(mainCtx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height))
      } catch (error) {
        console.error("Error saving canvas state:", error)
      }
    }
  }, [historySaveState, getMainContext])

  const applyOperationToMainCanvas = useCallback(
      (operation: (ctx: CanvasRenderingContext2D) => void) => {
        const mainCtx = getMainContext()
        if (!mainCtx || !canvasRef.current) return
        operation(mainCtx)
        saveCanvasState()
      },
      [getMainContext, saveCanvasState],
  )

  const clearSelection = useCallback(
      (shouldSaveState = true) => {
        const overlayCtx = getOverlayContext()
        if (
            overlayCtx &&
            overlayCanvasRef.current &&
            overlayCanvasRef.current.width > 0 &&
            overlayCanvasRef.current.height > 0
        ) {
          overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
        }
        setSelectionRect(null)
        setSelectedImageData(null)
        setIsSelecting(false)
        setIsMovingSelection(false)
        setIsMoveMode(false)
        setMoveImageData(null)
        if (shouldSaveState) {
          saveCanvasState()
        }
      },
      [getOverlayContext, saveCanvasState],
  )

  const resizeCanvases = useCallback(
      (forceWidth?: number, forceHeight?: number) => {
        const mainCanvas = canvasRef.current
        const overlayCanvas = overlayCanvasRef.current
        const canvasContainer = canvasContainerRef.current
        if (mainCanvas && overlayCanvas && canvasContainer) {
          const mainCtx = mainCanvas.getContext("2d")
          if (!mainCtx) return
          const tempCanvas = document.createElement("canvas")
          if (mainCanvas.width > 0 && mainCanvas.height > 0) {
            tempCanvas.width = mainCanvas.width
            tempCanvas.height = mainCanvas.height
            const tempCtx = tempCanvas.getContext("2d")
            tempCtx?.drawImage(mainCanvas, 0, 0)
          }
          const newWidth = forceWidth ?? canvasContainer.clientWidth
          const newHeight = forceHeight ?? canvasContainer.clientHeight
          if (newWidth <= 0 || newHeight <= 0) return
          mainCanvas.width = newWidth
          mainCanvas.height = newHeight
          overlayCanvas.width = newWidth
          overlayCanvas.height = newHeight
          mainCtx.fillStyle = "#FFFFFF"
          mainCtx.fillRect(0, 0, newWidth, newHeight)
          if (tempCanvas.width > 0 && tempCanvas.height > 0) {
            mainCtx.drawImage(tempCanvas, 0, 0)
          }
          const overlayCtx = overlayCanvas.getContext("2d")
          overlayCtx?.clearRect(0, 0, newWidth, newHeight)
          saveCanvasState()
        }
      },
      [saveCanvasState],
  )

  const finalizeSelectionMove = useCallback(() => {
    const mainCtx = getMainContext()
    const overlayCtx = getOverlayContext()
    if (!mainCtx || !overlayCtx || !selectionRect || !selectedImageData) return

    if (isMovingSelection) {
      mainCtx.clearRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height)
      mainCtx.putImageData(selectedImageData, currentPos.x, currentPos.y)
      setSelectionRect((prevRect) => (prevRect ? { ...prevRect, x: currentPos.x, y: currentPos.y } : null))
    }

    if (overlayCanvasRef.current && overlayCanvasRef.current.width > 0 && overlayCanvasRef.current.height > 0) {
      overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
    }

    setSelectedImageData(null)
    setIsMovingSelection(false)
    saveCanvasState()
  }, [
    getMainContext,
    getOverlayContext,
    selectionRect,
    selectedImageData,
    currentPos,
    saveCanvasState,
    isMovingSelection,
  ])

  const handleCopy = useCallback(() => {
    if (tool === "select" && selectionRect && selectedImageData) {
      setClipboardData(selectedImageData)
      console.log("Seleção copiada!")
    }
  }, [tool, selectionRect, selectedImageData])

  const handlePaste = useCallback(() => {
    if (clipboardData) {
      const mainCtx = getMainContext()
      if (!mainCtx || !canvasRef.current) return

      clearSelection(false)

      const pasteX = mousePosition.x
      const pasteY = mousePosition.y

      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = clipboardData.width
      tempCanvas.height = clipboardData.height
      const tempCtx = tempCanvas.getContext("2d")

      if (tempCtx) {
        tempCtx.putImageData(clipboardData, 0, 0)

        const imageData = tempCtx.getImageData(0, 0, clipboardData.width, clipboardData.height)
        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          if (r >= 250 && g >= 250 && b >= 250) {
            data[i + 3] = 0
          }
        }

        tempCtx.putImageData(imageData, 0, 0)

        mainCtx.drawImage(tempCanvas, pasteX, pasteY)
      }

      saveCanvasState()
      console.log("Imagem colada na posição do mouse!")
    }
  }, [clipboardData, mousePosition, getMainContext, saveCanvasState, clearSelection])

  const processStartDrawing = useCallback(
      (x: number, y: number) => {
        const mainCtx = getMainContext()
        if (!mainCtx || !canvasRef.current || canvasRef.current.width === 0 || canvasRef.current.height === 0) return

        setCurrentPos({ x, y })
        setStartPos({ x, y })

        if (tool === "move") {
          const imageData = mainCtx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
          const pixelData = imageData.data
          const pixelIndex = (Math.floor(y) * canvasRef.current.width + Math.floor(x)) * 4

          if (pixelData[pixelIndex] !== 255 || pixelData[pixelIndex + 1] !== 255 || pixelData[pixelIndex + 2] !== 255) {
            setIsMoveMode(true)
            setMoveStartPos({ x, y })
            const selectionSize = 50
            const selX = Math.max(0, x - selectionSize / 2)
            const selY = Math.max(0, y - selectionSize / 2)
            const selWidth = Math.min(selectionSize, canvasRef.current.width - selX)
            const selHeight = Math.min(selectionSize, canvasRef.current.height - selY)

            const moveData = mainCtx.getImageData(selX, selY, selWidth, selHeight)
            setMoveImageData(moveData)
            setSelectionRect({ x: selX, y: selY, width: selWidth, height: selHeight })
            setIsMovingSelection(true)
            setSelectionMoveStart({ x: x - selX, y: y - selY })
          }
          return
        }

        if (tool === "select") {
          if (selectionRect) {
            const overlayCtx = getOverlayContext()
            if (
                overlayCtx &&
                overlayCanvasRef.current &&
                overlayCanvasRef.current.width > 0 &&
                overlayCanvasRef.current.height > 0
            ) {
              overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
            }
            setSelectionRect(null)
            setSelectedImageData(null)
          }
          setIsSelecting(true)
          return
        }

        if (tool === "text") {
          const text = prompt("Digite o texto:")
          if (text) {
            applyOperationToMainCanvas((ctx) => {
              ctx.font = `${currentFontSize}px ${currentFont}`
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
      },
      [
        getMainContext,
        tool,
        selectionRect,
        selectedImageData,
        applyOperationToMainCanvas,
        currentFontSize,
        currentFont,
        color,
        opacity,
        saveCanvasState,
        getOverlayContext,
      ],
  )

  const processDraw = useCallback(
      (x: number, y: number) => {
        const mainCtx = getMainContext()
        const overlayCtx = getOverlayContext()
        if (!mainCtx || !overlayCtx || !canvasRef.current || !overlayCanvasRef.current) return

        if (overlayCanvasRef.current.width > 0 && overlayCanvasRef.current.height > 0) {
          overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
        }

        if (tool === "move" && isMoveMode && isMovingSelection && moveImageData && selectionRect) {
          const newX = x - selectionMoveStart.x
          const newY = y - selectionMoveStart.y

          overlayCtx.putImageData(moveImageData, newX, newY)
          overlayCtx.setLineDash([4, 2])
          overlayCtx.strokeStyle = "rgba(255,0,0,0.8)"
          overlayCtx.strokeRect(newX, newY, selectionRect.width, selectionRect.height)
          overlayCtx.setLineDash([])
          setCurrentPos({ x: newX, y: newY })
          return
        }

        if (tool === "select") {
          if (isSelecting) {
            const width = x - startPos.x
            const height = y - startPos.y
            overlayCtx.setLineDash([4, 2])
            overlayCtx.strokeStyle = "rgba(0,0,0,0.8)"
            overlayCtx.strokeRect(startPos.x, startPos.y, width, height)
            overlayCtx.setLineDash([])
            setCurrentPos({ x, y })
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
          if (tool === "rectangle") drawRectangle(overlayCtx, startPos.x, startPos.y, x, y, color, false)
          else if (tool === "circle") {
            const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
            drawCircle(overlayCtx, startPos.x, startPos.y, radius, color, false)
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
      },
      [
        getMainContext,
        getOverlayContext,
        tool,
        isMoveMode,
        isMovingSelection,
        moveImageData,
        selectionRect,
        selectionMoveStart,
        isSelecting,
        startPos,
        isShapeDrawing,
        opacity,
        color,
        isDrawing,
        brushSize,
      ],
  )

  const stopDrawing = useCallback(() => {
    const mainCtx = getMainContext()
    const overlayCtx = getOverlayContext()
    if (!mainCtx || !overlayCtx || !overlayCanvasRef.current) return

    if (tool === "move" && isMoveMode && isMovingSelection && moveImageData && selectionRect) {
      mainCtx.clearRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height)
      mainCtx.putImageData(moveImageData, currentPos.x, currentPos.y)
      setIsMoveMode(false)
      setMoveImageData(null)
      setSelectionRect(null)
      setIsMovingSelection(false)
      saveCanvasState()
    }

    if (tool === "select") {
      if (isSelecting) {
        const selX = Math.min(startPos.x, currentPos.x)
        const selY = Math.min(startPos.y, currentPos.y)
        const selWidth = Math.abs(currentPos.x - startPos.x)
        const selHeight = Math.abs(currentPos.y - startPos.y)
        if (selWidth > 0 && selHeight > 0) {
          setSelectionRect({ x: selX, y: selY, width: selWidth, height: selHeight })
          if (canvasRef.current && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
            const imageData = mainCtx.getImageData(selX, selY, selWidth, selHeight)
            setSelectedImageData(imageData)
          }
        } else {
          clearSelection(false)
        }
        setIsSelecting(false)
      }
      return
    }

    if (isShapeDrawing) {
      mainCtx.globalAlpha = opacity
      if (tool === "rectangle") drawRectangle(mainCtx, startPos.x, startPos.y, currentPos.x, currentPos.y, color, false)
      else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2))
        drawCircle(mainCtx, startPos.x, startPos.y, radius, color, false)
      }
      mainCtx.globalAlpha = 1
      saveCanvasState()
    } else if (isDrawing) {
      mainCtx.beginPath()
      saveCanvasState()
    }

    if (overlayCanvasRef.current.width > 0 && overlayCanvasRef.current.height > 0) {
      overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
    }
    setIsDrawing(false)
    setIsShapeDrawing(false)
    mainCtx.globalCompositeOperation = "source-over"
  }, [
    getMainContext,
    getOverlayContext,
    tool,
    isMoveMode,
    isMovingSelection,
    moveImageData,
    selectionRect,
    currentPos,
    saveCanvasState,
    isSelecting,
    startPos,
    clearSelection,
    isShapeDrawing,
    opacity,
    color,
    isDrawing,
  ])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getScaledPos(e.clientX, e.clientY)
    if (pos) processStartDrawing(pos.x, pos.y)
  }
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getScaledPos(e.clientX, e.clientY)
    if (pos) {
      setMousePosition({ x: pos.x, y: pos.y })
      if (!isDrawing && !isShapeDrawing && !isSelecting && !isMovingSelection && !isMoveMode) return
      processDraw(pos.x, pos.y)
    }
  }
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0]
    if (touch) {
      const pos = getScaledPos(touch.clientX, touch.clientY)
      if (pos) processStartDrawing(pos.x, pos.y)
    }
  }
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0]
    if (touch) {
      const pos = getScaledPos(touch.clientX, touch.clientY)
      if (pos) {
        setMousePosition({ x: pos.x, y: pos.y })
        if (!isDrawing && !isShapeDrawing && !isSelecting && !isMovingSelection && !isMoveMode) return
        processDraw(pos.x, pos.y)
      }
    }
  }

  const handleUndo = useCallback(() => {
    historyUndo((imageData) => {
      const mainCtx = getMainContext()
      if (mainCtx) mainCtx.putImageData(imageData, 0, 0)
    })
  }, [historyUndo, getMainContext])

  const handleRedo = useCallback(() => {
    historyRedo((imageData) => {
      const mainCtx = getMainContext()
      if (mainCtx) mainCtx.putImageData(imageData, 0, 0)
    })
  }, [historyRedo, getMainContext])

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataURL = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = `${windowTitle.replace("Lucas Paint -", "") || "canvas"}.png`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [windowTitle])

  const handleLoad = useCallback(
      (file: File) => {
        const img = new Image()
        img.onload = () => {
          setTimeout(() => {
            const freshMainCtx = getMainContext()
            if (freshMainCtx && canvasRef.current) {
              freshMainCtx.drawImage(img, 0, 0)
              saveCanvasState()
            }
          }, 50)
        }
        img.src = URL.createObjectURL(file)
      },
      [getMainContext, saveCanvasState],
  )

  const handleClear = useCallback(() => {
    const mainCtx = getMainContext()
    if (mainCtx && canvasRef.current && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
      mainCtx.fillStyle = "#FFFFFF"
      mainCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      saveCanvasState()
      setWindowTitle("Lucas Paint - sem título")
      setTempTitle("Lucas Paint - sem título")
      clearSelection(false)
    }
  }, [getMainContext, saveCanvasState, clearSelection])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMobile || isMaximized) resizeCanvases()
      else resizeCanvases(1200, 800)
    }, 100)
    return () => clearTimeout(timer)
  }, [isMobile, isMaximized, resizeCanvases])

  useEffect(() => {
    const initialIsMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
    const timer = setTimeout(() => {
      if (initialIsMobile) resizeCanvases()
      else resizeCanvases(1200, 800)
    }, 50)
    return () => clearTimeout(timer)
  }, [resizeCanvases])

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
            ;(document.getElementById("file-open-trigger-in-menubar") as HTMLElement)?.click()
            break
          case "c":
            e.preventDefault()
            handleCopy()
            break
          case "v":
            e.preventDefault()
            handlePaste()
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
          if (!e.ctrlKey && !e.metaKey) {
            setTool("circle")
          }
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
        case "m":
          if (!e.ctrlKey && !e.metaKey) {
            setTool("move")
            clearSelection(false)
          }
          break
        case "v":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handlePaste()
          } else {
            setTool("select")
            clearSelection(false)
          }
          break
        case "delete":
        case "backspace":
          if (tool === "select" && selectionRect) {
            const mainCtx = getMainContext()
            if (mainCtx) {
              mainCtx.fillStyle = "#FFFFFF"
              mainCtx.fillRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height)
              clearSelection()
            }
          }
          break
        case "escape":
          if (
              (tool === "select" || tool === "move") &&
              (selectionRect || isSelecting || isMovingSelection || isMoveMode)
          )
            clearSelection()
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
    handleCopy,
    handlePaste,
    tool,
    selectionRect,
    isSelecting,
    isMovingSelection,
    isMoveMode,
    clearSelection,
    getMainContext,
  ])

  useEffect(() => {
    if (tool !== "select" && tool !== "move") {
      if (selectionRect || isMovingSelection || isMoveMode) {
        clearSelection(false)
        setIsMoveMode(false)
        setMoveImageData(null)
      }
    }
  }, [tool, selectionRect, isMovingSelection, isMoveMode, clearSelection])

  const addCustomColor = (newColor: string) => {
    if (!customColors.includes(newColor)) setCustomColors((prev) => [...prev.slice(-7), newColor])
  }
  const viewBlack = () => {
    const mainCtx = getMainContext()
    if (mainCtx && canvasRef.current && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
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
      setTimeout(() => mainCtx.putImageData(currentState, 0, 0), 2000)
    }
  }
  const startDraggingWindow = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditingTitle || isMaximized || isMobile) return
    setDragging(true)
    setPosition({
      x: e.clientX - (containerRef.current?.offsetLeft || 0),
      y: e.clientY - (containerRef.current?.offsetTop || 0),
    })
  }
  const onDragWindow = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging && !isMaximized && !isMobile && containerRef.current) {
      containerRef.current.style.left = `${e.clientX - position.x}px`
      containerRef.current.style.top = `${e.clientY - position.y}px`
    }
  }
  const stopDraggingWindow = () => setDragging(false)
  const handleTitleDoubleClick = () => {
    if (isMobile) return
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
  const handleToggleMaximize = () => {
    if (isMobile) return
    const windowEl = containerRef.current
    if (!windowEl) return
    setIsMaximized((prev) => {
      if (!prev)
        originalWindowState.current = {
          width: windowEl.style.width || getComputedStyle(windowEl).width,
          left: windowEl.style.left || getComputedStyle(windowEl).left,
          top: windowEl.style.top || getComputedStyle(windowEl).top,
          transform: windowEl.style.transform || getComputedStyle(windowEl).transform,
        }
      return !prev
    })
  }

  const getWindowStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: windowBackgroundColor,
      position: "absolute",
      display: "flex",
      flexDirection: "column",
    }
    if (isMobile || isMaximized)
      return {
        ...baseStyle,
        width: "100%",
        height: "100%",
        top: "0px",
        left: "0px",
        transform: "none",
        borderWidth: isMobile ? "0px" : "2px",
        borderColor: "white",
        boxShadow: isMobile ? "none" : "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      }
    else {
      const r = originalWindowState.current || {
        width: "900px",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }
      return {
        ...baseStyle,
        ...r,
        borderWidth: "2px",
        borderColor: "white",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      }
    }
  }
  const getCanvasElementStyle = (): React.CSSProperties => {
    if (isMobile || isMaximized) return { width: "100%", height: "100%" }
    else return { width: `${canvasRef.current?.width || 1200}px`, height: `${canvasRef.current?.height || 800}px` }
  }

  return (
      <>
        <input
            type="color"
            ref={pageBgColorInputRef}
            className="sr-only"
            value={pageBackgroundColor}
            onChange={(e) => setPageBackgroundColor(e.target.value)}
        />
        <div className="h-screen overflow-hidden select-none" style={{ backgroundColor: pageBackgroundColor }}>
          <div ref={containerRef} style={getWindowStyle()}>
            <input
                type="color"
                ref={windowColorInputRef}
                className="sr-only"
                value={windowBackgroundColor}
                onChange={(e) => setWindowBackgroundColor(e.target.value)}
            />
            {!isMobile && (
                <div
                    className="px-2 py-1 flex justify-between items-center shrink-0"
                    style={{
                      backgroundColor: windowBackgroundColor,
                      color: titleBarTextColor,
                      cursor: isMaximized ? "default" : "move",
                    }}
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
                          className="px-1 flex-grow"
                          style={{
                            backgroundColor: "transparent",
                            color: titleBarTextColor,
                            borderBottom: `1px solid ${titleBarTextColor === "white" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}`,
                          }}
                          autoFocus
                      />
                  ) : (
                      <span onDoubleClick={handleTitleDoubleClick} className="flex-grow select-none">
                  {windowTitle}
                </span>
                  )}
                  <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        className={`h-5 w-5 p-0 min-w-0 ${titleBarButtonHoverClass}`}
                        style={{ color: titleBarTextColor }}
                        onClick={() => {
                          if (isMaximized) {
                            handleToggleMaximize()
                          }
                        }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        className={`h-5 w-5 p-0 min-w-0 ${titleBarButtonHoverClass}`}
                        style={{ color: titleBarTextColor }}
                        onClick={handleToggleMaximize}
                    >
                      {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    </Button>
                    <Button
                        variant="ghost"
                        className={`h-5 w-5 p-0 min-w-0 ${titleBarButtonHoverClass}`}
                        style={{ color: titleBarTextColor }}
                        // onClick={() => { /* Close action if needed */ }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
            )}
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
                isMobile={isMobile}
            />
            <div className={`flex flex-grow min-h-0 ${isMobile ? "flex-col" : ""}`}>
              <ToolPanel
                  selectedTool={tool}
                  onToolChange={setTool}
                  brushSize={brushSize}
                  onBrushSizeChange={setBrushSize}
                  opacity={opacity}
                  onOpacityChange={setOpacity}
                  isMobile={isMobile}
                  currentFont={currentFont}
                  onFontChange={setCurrentFont}
                  currentFontSize={currentFontSize}
                  onFontSizeChange={setCurrentFontSize}
              />
              <div
                  ref={canvasContainerRef}
                  className="relative border border-gray-400 flex-grow bg-white canvas-container"
                  style={{
                    height: !isMobile && !isMaximized ? "500px" : undefined,
                    overflow: !isMobile && !isMaximized ? "auto" : "hidden",
                  }}
              >
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={stopDrawing}
                    className="absolute top-0 left-0 cursor-crosshair"
                    style={getCanvasElementStyle()}
                />
                <canvas
                    ref={overlayCanvasRef}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={getCanvasElementStyle()}
                />
              </div>
            </div>
            <ColorPicker
                selectedColor={color}
                onColorChange={setColor}
                customColors={customColors}
                onAddCustomColor={addCustomColor}
                isMobile={isMobile}
            />
            {!isMobile && (
                <div className="bg-gray-300 px-2 py-1 text-sm border-t border-gray-400 flex justify-between shrink-0">
              <span>
                Ferramenta: {tool} | Tam: {brushSize}px | Opac: {Math.round(opacity * 100)}%
                {clipboardData && " | Clipboard: ✓"}
              </span>
                  <span>
                Ctrl+O: Abrir | Ctrl+S: Salvar | Ctrl+Z: Desfazer | V: Seleção | M: Mover | Ctrl+C: Copiar | Ctrl+V:
                Colar
              </span>
                </div>
            )}
          </div>
        </div>
        {!isMobile && <PortfolioPopup />}
      </>
  )
}