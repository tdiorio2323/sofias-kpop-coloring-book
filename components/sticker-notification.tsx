"use client"

import { useEffect, useState } from "react"
import type { Sticker } from "@/lib/storage"

interface StickerNotificationProps {
  sticker: Sticker | null
  onClose: () => void
}

export function StickerNotification({ sticker, onClose }: StickerNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (sticker) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [sticker, onClose])

  if (!sticker) return null

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-card border-4 border-primary rounded-3xl p-6 shadow-2xl shadow-primary/50 min-w-[300px]">
        <div className="text-center">
          <div className="text-6xl mb-2 animate-bounce">{sticker.emoji}</div>
          <div className="text-xl font-bold text-foreground mb-1">New Sticker!</div>
          <div className="text-lg text-muted-foreground">{sticker.name}</div>
        </div>
      </div>
    </div>
  )
}
