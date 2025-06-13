import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "Paint",
    description: "by lucas lima",
    icons: {
        icon: [
            { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
        ],
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    )
}
