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
  onOpenWindowColorPicker: () => void
  onOpenPageBackgroundColorPicker: () => void // Adicionar esta linha
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
                          onOpenPageBackgroundColorPicker, // Adicionar esta linha
                        }: MenuBarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onLoad(file)
    }
    // Resetar o valor do input para permitir selecionar o mesmo arquivo novamente
    if (event.target) {
      event.target.value = ""
    }
  }

  const triggerFileInput = () => {
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
              <input type="file" accept="image/*" onChange={handleFileLoad} className="hidden" ref={fileInputRef} />
              <DropdownMenuItem
                  onSelect={(e) => {
                    // Prevenir o comportamento padrão do DropdownMenuItem que pode fechar o menu
                    // e permitir que o clique no input de arquivo funcione
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