"use client"

import { X } from "lucide-react"
import { getUnlockedStickers } from "@/lib/storage"
import { useEffect, useState } from "react"
import type { Sticker } from "@/lib/storage"

interface StickerBookProps {
  isOpen: boolean
  onClose: () => void
}

export function StickerBook({ isOpen, onClose }: StickerBookProps) {
  const [stickers, setStickers] = useState<Sticker[]>([])

  useEffect(() => {
    if (isOpen) {
      setStickers(getUnlockedStickers())
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-3xl border-4 border-primary shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-primary p-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-primary-foreground">Sticker Collection</h2>
          <button
            onClick={onClose}
            className="w-12 h-12 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            aria-label="Close sticker book"
          >
            <X className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>

        {/* Sticker grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {stickers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-xl text-muted-foreground">Complete coloring pages to unlock stickers!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="bg-muted rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform"
                >
                  <div className="text-5xl">{sticker.emoji}</div>
                  <div className="text-sm font-bold text-center text-foreground">{sticker.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
