"use client"

import { useState, useCallback } from "react"

export function useHistory() {
  const [history, setHistory] = useState<ImageData[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const saveState = useCallback(
    (imageData: ImageData) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, currentIndex + 1)
        newHistory.push(imageData)
        if (newHistory.length > 50) {
          // Limit history to 50 states
          newHistory.shift()
          return newHistory
        }
        return newHistory
      })
      setCurrentIndex((prev) => Math.min(prev + 1, 49))
    },
    [currentIndex],
  )

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      return history[currentIndex - 1]
    }
    return null
  }, [currentIndex, history])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      return history[currentIndex + 1]
    }
    return null
  }, [currentIndex, history])

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  return { saveState, undo, redo, canUndo, canRedo }
}
