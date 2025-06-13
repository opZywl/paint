"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { User, X, ExternalLink } from "lucide-react"

export function PortfolioPopup() {
    const [isOpen, setIsOpen] = useState(false)

    const togglePopup = () => setIsOpen(!isOpen)

    return (
        <>
            {/* Ícone flutuante */}
            {!isOpen && (
                <button
                    onClick={togglePopup}
                    className="fixed bottom-4 right-4 z-50 bg-black rounded-full p-3 shadow-lg hover:bg-gray-800 transition-colors" // Cor alterada para bg-black, posicionamento ajustado
                    aria-label="Abrir informações do desenvolvedor"
                >
                    <User className="h-6 w-6 text-white" />
                    <span
                        className={`absolute top-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-black ${
                            !isOpen ? "animate-pulse" : "" // Animação de piscar quando fechado
                        }`}
                    />
                </button>
            )}

            {/* Popup */}
            {isOpen && (
                <div className="fixed bottom-4 right-4 z-50 w-72 bg-black text-white rounded-lg shadow-xl border border-gray-800 transform translate-y-0 opacity-100 transition-all duration-300 ease-out">
                    {/* Ajuste para aparecer acima do botão flutuante se necessário, ou ajustar a posição inicial */}
                    {/* Exemplo: bottom-20 right-4 se o botão estiver em bottom-4 right-4 */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10 border-2 border-gray-700">
                                    <AvatarFallback className="bg-gray-700 text-gray-400">
                                        <User className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-base">Lucas Lima</h3>
                                    <p className="text-xs text-gray-400">Full Stack Developer</p>
                                </div>
                            </div>
                            <button onClick={togglePopup} className="text-gray-400 hover:text-white" aria-label="Fechar popup">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-300 mb-4">it's awesome</p>

                        <a href="https://lucas-lima.vercel.app" target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button variant="secondary" className="w-full bg-gray-700 hover:bg-gray-600 text-white">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver Portfólio
                            </Button>
                        </a>
                    </div>
                </div>
            )}
        </>
    )
}