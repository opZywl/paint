"use client"
import { Button } from "@/components/ui/button"

interface ColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
  customColors: string[]
  onAddCustomColor: (color: string) => void
  isMobile: boolean
}

const mobileDefaultColors = [
  "#000000",
  "#808080",
  "#800000",
  "#808000",
  "#008000",
  "#008080",
  "#000080",
  "#800080",
  "#FFFFFF",
  "#C0C0C0",
  "#FF0000",
  "#FFFF00",
  "#00FF00",
  "#00FFFF",
  "#0000FF",
  "#FF00FF",
]

const desktopDefaultColors = [
  "#000000",
  "#808080",
  "#800000",
  "#808000",
  "#008000",
  "#008080",
  "#000080",
  "#800080",
  "#808040",
  "#004040",
  "#0080FF",
  "#004080",
  "#8000FF",
  "#804000",
  "#FFFFFF",
  "#C0C0C0",
  "#FF0000",
  "#FFFF00",
  "#00FF00",
  "#00FFFF",
  "#0000FF",
  "#FF00FF",
  "#FFFF80",
  "#00FF80",
  "#80FFFF",
  "#8080FF",
  "#FF0080",
  "#FF8040",
]

export function ColorPicker({
                              selectedColor,
                              onColorChange,
                              customColors,
                              onAddCustomColor,
                              isMobile,
                            }: ColorPickerProps) {
  const colorsToDisplay = isMobile ? mobileDefaultColors : desktopDefaultColors

  return (
      <div
          className={`flex bg-gray-300 p-2 border-t border-gray-400 ${isMobile ? "overflow-x-auto flex-nowrap" : "flex-wrap"}`}
      >
        <div className={`flex gap-1 mr-4 ${isMobile ? "flex-nowrap" : "flex-wrap"}`}>
          {colorsToDisplay.map((color) => (
              <Button
                  key={color}
                  variant="ghost"
                  className={`w-6 h-6 p-0 min-w-0 border shrink-0 ${selectedColor === color ? "ring-2 ring-gray-600" : "border-gray-400"}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChange(color)}
              />
          ))}
        </div>
        {!isMobile && (
            <>
              <div className="flex flex-wrap gap-1 mr-4">
                {customColors.map((color, index) => (
                    <Button
                        key={`custom-${index}`}
                        variant="ghost"
                        className={`w-6 h-6 p-0 min-w-0 border ${selectedColor === color ? "ring-2 ring-gray-600" : "border-gray-400"}`}
                        style={{ backgroundColor: color }}
                        onClick={() => onColorChange(color)}
                    />
                ))}
              </div>
              <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => {
                    onColorChange(e.target.value)
                    onAddCustomColor(e.target.value)
                  }}
                  className="w-8 h-6 border border-gray-400 cursor-pointer"
              />
            </>
        )}
      </div>
  )
}