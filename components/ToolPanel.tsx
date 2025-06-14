"use client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
    Brush,
    Eraser,
    Square,
    Circle,
    Type,
    Pipette,
    SprayCanIcon as Spray,
    MousePointerIcon as MousePointerSquare,
    PenLineIcon as Line,
    OctagonIcon as Polygon,
    StarIcon,
    ArrowLeftIcon as Arrow,
    CircleIcon as Curve,
    PencilIcon,
    PaintBucket,
} from "lucide-react"

interface ToolPanelProps {
    selectedTool: string
    onToolChange: (tool: string) => void
    brushSize: number
    onBrushSizeChange: (size: number) => void
    opacity: number
    onOpacityChange: (opacity: number) => void
    isMobile: boolean
    currentFont?: string
    onFontChange?: (font: string) => void
    currentFontSize?: number
    onFontSizeChange?: (size: number) => void
}

export function ToolPanel({
                              selectedTool,
                              onToolChange,
                              brushSize,
                              onBrushSizeChange,
                              opacity,
                              onOpacityChange,
                              isMobile,
                              currentFont = "Arial",
                              onFontChange = () => {},
                              currentFontSize = 16,
                              onFontSizeChange = () => {},
                          }: ToolPanelProps) {
    const tools = [
        { id: "brush", icon: Brush, name: "Pincel" },
        { id: "pencil", icon: PencilIcon, name: "Lápis" },
        { id: "eraser", icon: Eraser, name: "Borracha" },
        { id: "bucket", icon: PaintBucket, name: "Balde de Tinta" },
        { id: "rectangle", icon: Square, name: "Retângulo" },
        { id: "circle", icon: Circle, name: "Círculo" },
        { id: "line", icon: Line, name: "Linha Reta" },
        { id: "polygon", icon: Polygon, name: "Polígono" },
        { id: "star", icon: StarIcon, name: "Estrela" },
        { id: "arrow", icon: Arrow, name: "Seta" },
        { id: "curve", icon: Curve, name: "Curva/Bezier" },
        { id: "text", icon: Type, name: "Texto" },
        { id: "select", icon: MousePointerSquare, name: "Seleção" },
        { id: "eyedropper", icon: Pipette, name: "Conta-gotas" },
        { id: "spray", icon: Spray, name: "Spray" },
    ]

    const fontOptions = ["Arial", "Times New Roman", "Courier New", "Verdana", "Georgia", "Comic Sans MS", "Impact"]

    const renderTextOptions = () => (
        <>
            <div>
                <Label className="text-xs">Fonte:</Label>
                <Select value={currentFont} onValueChange={onFontChange}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Fonte" />
                    </SelectTrigger>
                    <SelectContent>
                        {fontOptions.map((font) => (
                            <SelectItem key={font} value={font} className="text-xs">
                                {font}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label className="text-xs">Tamanho:</Label>
                <Input
                    type="number"
                    value={currentFontSize}
                    onChange={(e) => onFontSizeChange(Math.max(8, Number(e.target.value)))}
                    className="h-8 text-xs"
                    min="8"
                    max="72"
                />
                <div className="text-xs text-center">{currentFontSize}px</div>
            </div>
        </>
    )

    const renderBrushOptions = () => (
        <>
            <div>
                <Label className="text-xs">Tamanho:</Label>
                <Input
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
                <Label className="text-xs">Opacidade:</Label>
                <Input
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
        </>
    )

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
                                <IconComponent className="w-5 h-5" />
                            </Button>
                        )
                    })}
                </div>
                <div className="flex gap-4 w-full px-2">
                    {selectedTool === "text" ? (
                        <div className="w-full grid grid-cols-2 gap-2">{renderTextOptions()}</div>
                    ) : (
                        <div className="flex gap-4 w-full">
                            <div className="flex-1">
                                <Label className="text-xs">Tam:</Label>
                                <Input
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
                                <Label className="text-xs">Opac:</Label>
                                <Input
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
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="w-24 bg-gray-300 p-1 border-r border-gray-400 flex flex-col">
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
                            <IconComponent className="w-4 h-4" />
                        </Button>
                    )
                })}
            </div>

            <div className="space-y-2">{selectedTool === "text" ? renderTextOptions() : renderBrushOptions()}</div>
        </div>
    )
}