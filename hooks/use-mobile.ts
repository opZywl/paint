"use client"

import { useState, useEffect } from "react"

export function useMobile(query = "(max-width: 768px)"): boolean {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") {
            return
        }

        const mediaQuery = window.matchMedia(query)
        const handleChange = () => setIsMobile(mediaQuery.matches)

        handleChange()

        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
    }, [query])

    return isMobile
}