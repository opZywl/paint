"use client"
import { Button } from "@/components/ui/button"
import {
    Brush,
    Eraser,
    Square,
    Circle,
    Type,
    Pipette,
    SprayCanIcon as Spray,
    MousePointerIcon as MousePointerSquare,
    Minus as Line,
    Shapes as Polygon,
    Star as StarIcon,
    ArrowRight as Arrow,
    LucidePackage2 as Curve,
    Pencil as PencilIcon,
} from "lucide-react"

interface ToolPanelProps {
    selectedTool: string
    onToolChange: (tool: string) => void
    brushSize: number
    onBrushSizeChange: (size: number) => void
    opacity: number
    onOpacityChange: (opacity: number) => void
    isMobile: boolean
}

export function ToolPanel({
                              selectedTool,
                              onToolChange,
                              brushSize,
                              onBrushSizeChange,
                              opacity,
                              onOpacityChange,
                              isMobile,
                          }: ToolPanelProps) {
    const tools = [
        { id: "brush", icon: Brush, name: "Pincel" },
        { id: "eraser", icon: Eraser, name: "Borracha" },
        { id: "rectangle", icon: Square, name: "Retângulo" },
        { id: "circle", icon: Circle, name: "Círculo" },
        { id: "text", icon: Type, name: "Texto" },
        { id: "select", icon: MousePointerSquare, name: "Seleção" },
        { id: "eyedropper", icon: Pipette, name: "Conta-gotas" },
        { id: "spray", icon: Spray, name: "Spray" },
        { id: "line", icon: Line, name: "Linha Reta" },
        { id: "polygon", icon: Polygon, name: "Polígono" },
        { id: "star", icon: StarIcon, name: "Estrela" },
        { id: "arrow", icon: Arrow, name: "Seta" },
        { id: "curve", icon: Curve, name: "Curva/Bezier" },
        { id: "pencil", icon: PencilIcon, name: "Lápis" },
    ]

    if (isMobile) {
        return (
            <div className="w-full bg-gray-300 p-1 border-b border-gray-400 flex flex-col items-center">
                <div className="flex flex-wrap justify-center gap-1 mb-2">
                    {tools.map((tool) => {
                        const IconComponent = tool.icon
                        return (
                            <Button
                                key={tool.id}
                                variant="ghost"
                                className={`w-10 h-10 p-1 ${selectedTool === tool.id ? "bg-gray-400 border border-gray-500 shadow-inner" : ""}`}
                                onClick={() => onToolChange(tool.id)}
                                title={tool.name}
                            >
                                {IconComponent ? (
                                    <IconComponent className="w-5 h-5" />
                                ) : (
                                    <div className="w-5 h-5 flex items-center justify-center">?</div>
                                )}
                            </Button>
                        )
                    })}
                </div>
                <div className="flex gap-4 w-full px-2">
                    <div className="flex-1">
                        <label className="text-xs">Tam:</label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={brushSize}
                            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-xs text-center">{brushSize}px</div>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs">Opac:</label>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={opacity}
                            onChange={(e) => onOpacityChange(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-xs text-center">{Math.round(opacity * 100)}%</div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-20 bg-gray-300 p-1 border-r border-gray-400 flex flex-col">
            <div className="grid grid-cols-2 gap-1 mb-4">
                {tools.map((tool) => {
                    const IconComponent = tool.icon
                    return (
                        <Button
                            key={tool.id}
                            variant="ghost"
                            className={`w-8 h-8 p-1 ${selectedTool === tool.id ? "bg-gray-400 border border-gray-500 shadow-inner" : ""}`}
                            onClick={() => onToolChange(tool.id)}
                            title={tool.name}
                        >
                            {IconComponent ? (
                                <IconComponent className="w-4 h-4" />
                            ) : (
                                <div className="w-4 h-4 flex items-center justify-center">?</div>
                            )}
                        </Button>
                    )
                })}
            </div>

            <div className="space-y-2">
                <div>
                    <label className="text-xs">Tamanho:</label>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={brushSize}
                        onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-xs text-center">{brushSize}px</div>
                </div>
                <div>
                    <label className="text-xs">Opacidade:</label>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={opacity}
                        onChange={(e) => onOpacityChange(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-xs text-center">{Math.round(opacity * 100)}%</div>
                </div>
            </div>
        </div>
    )
}