"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface MenuBarProps {
  onSave: () => void
  onLoad: (file: File) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  canUndo: boolean
  canRedo: boolean
  onViewBlack: () => void
  onOpenWindowColorPicker: () => void
  onOpenPageBackgroundColorPicker: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  zoomLevel: number
  onZoomChange: (zoom: number) => void
  isMobile: boolean
}

export function MenuBar({
                          onSave,
                          onLoad,
                          onUndo,
                          onRedo,
                          onClear,
                          canUndo,
                          canRedo,
                          onViewBlack,
                          onOpenWindowColorPicker,
                          onOpenPageBackgroundColorPicker,
                          onZoomIn,
                          onZoomOut,
                          zoomLevel,
                          onZoomChange,
                          isMobile,
                        }: MenuBarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [zoomInput, setZoomInput] = React.useState(Math.round(zoomLevel * 100).toString())

  React.useEffect(() => {
    setZoomInput(Math.round(zoomLevel * 100).toString())
  }, [zoomLevel])

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onLoad(file)
    }
    if (event.target) {
      event.target.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleHelpClick = () => {
    window.open("https://lucas-lima.xyz", "_blank", "noopener,noreferrer")
  }

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setZoomInput(value)
  }

  const handleZoomInputBlur = () => {
    const numValue = Number.parseInt(zoomInput)
    if (!isNaN(numValue) && numValue >= 10 && numValue <= 500) {
      onZoomChange(numValue / 100)
    } else {
      setZoomInput(Math.round(zoomLevel * 100).toString())
    }
  }

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleZoomInputBlur()
      e.currentTarget.blur()
    }
    if (e.key === "Escape") {
      setZoomInput(Math.round(zoomLevel * 100).toString())
      e.currentTarget.blur()
    }
  }

  return (
      <div
          className={`bg-gray-300 px-2 py-1 border-b border-gray-400 flex items-center gap-2 ${isMobile ? "overflow-x-auto" : ""}`}
      >
        <div className="flex items-center gap-1 mr-4 whitespace-nowrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm px-2 py-1 h-auto" id="file-open-trigger-in-menubar">
                Arquivo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <input type="file" accept="image/*" onChange={handleFileLoad} className="hidden" ref={fileInputRef} />
              <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    triggerFileInput()
                  }}
              >
                Abrir
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onSave}>Salvar</DropdownMenuItem>
              <DropdownMenuItem onSelect={onClear}>Novo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
                Editar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onUndo} disabled={!canUndo}>
                Desfazer
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onRedo} disabled={!canRedo}>
                Refazer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
                Ver
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onViewBlack}>Visualizar em Preto</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
                Imagem
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onSave}>Download</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
                Opções
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    onOpenWindowColorPicker()
                  }}
              >
                Cor da Janela
              </DropdownMenuItem>
              <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    onOpenPageBackgroundColorPicker()
                  }}
              >
                Cor do Fundo da Página
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" className="text-sm px-2 py-1 h-auto" onClick={handleHelpClick}>
            Ajuda
          </Button>
        </div>

        {!isMobile && (
            <div className="flex items-center gap-1 border-l border-gray-400 pl-2">
              <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} title="Desfazer (Ctrl+Z)">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} title="Refazer (Ctrl+Y)">
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClear} title="Limpar Tudo">
                Limpar
              </Button>
              <Button variant="ghost" size="sm" onClick={onZoomOut} title="Diminuir Zoom">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Input
                  type="text"
                  value={zoomInput}
                  onChange={handleZoomInputChange}
                  onBlur={handleZoomInputBlur}
                  onKeyDown={handleZoomInputKeyDown}
                  className="w-12 h-8 text-xs text-center"
                  title="Zoom (10-500%)"
              />
              <span className="text-xs">%</span>
              <Button variant="ghost" size="sm" onClick={onZoomIn} title="Aumentar Zoom">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
        )}
      </div>
  )
}