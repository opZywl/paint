"use client"

import { useState, useCallback } from "react"

export function useHistory() {
  const [history, setHistory] = useState<ImageData[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const saveState = useCallback(
      (imageData: ImageData) => {
        setHistory((prevHistory) => {
          const newHistoryUncapped = prevHistory.slice(0, currentIndex + 1)
          newHistoryUncapped.push(imageData)

          const newHistoryCapped =
              newHistoryUncapped.length > 50 ? newHistoryUncapped.slice(newHistoryUncapped.length - 50) : newHistoryUncapped

          setCurrentIndex(newHistoryCapped.length - 1)
          return newHistoryCapped
        })
      },
      [currentIndex],
  )

  const undo = useCallback(
      (callback: (imageData: ImageData) => void) => {
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1
          const imageDataToRestore = history[newIndex]
          if (imageDataToRestore) {
            setCurrentIndex(newIndex)
            callback(imageDataToRestore)
          }
        }
      },
      [currentIndex, history],
  ) // callback is a parameter, not a dependency of this useCallback

  const redo = useCallback(
      (callback: (imageData: ImageData) => void) => {
        if (currentIndex < history.length - 1) {
          const newIndex = currentIndex + 1
          const imageDataToRestore = history[newIndex]
          if (imageDataToRestore) {
            setCurrentIndex(newIndex)
            callback(imageDataToRestore)
          }
        }
      },
      [currentIndex, history],
  ) // callback is a parameter, not a dependency of this useCallback

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  return { saveState, undo, redo, canUndo, canRedo }
}