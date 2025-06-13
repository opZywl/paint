"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, RotateCw } from "lucide-react"
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
}

export function MenuBar({ onSave, onLoad, onUndo, onRedo, onClear, canUndo, canRedo, onViewBlack }: MenuBarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null) // Adicionar esta ref

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onLoad(file)
    }
  }

  const triggerFileInput = () => {
    // Adicionar esta função
    fileInputRef.current?.click()
  }

  return (
    <div className="bg-gray-300 px-2 py-1 border-b border-gray-400 flex items-center gap-2">
      <div className="flex items-center gap-1 mr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
              Arquivo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {/* Input de arquivo oculto */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileLoad}
              className="hidden"
              ref={fileInputRef} // Associar a ref
            />
            {/* Item do menu para acionar o input */}
            <DropdownMenuItem onSelect={triggerFileInput}>Abrir</DropdownMenuItem>
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

        <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
          Opções
        </Button>
        <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
          Ajuda
        </Button>
      </div>

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
      </div>
    </div>
  )
}
