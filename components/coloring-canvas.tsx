"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { Home, Undo2, Eraser, Sparkles, BookOpen } from "lucide-react"
import { soundEffects } from "@/lib/sound-effects"
import { saveColoring, getSavedColoring, unlockRandomSticker } from "@/lib/storage"
import type { Sticker } from "@/lib/storage"
import { StickerNotification } from "@/components/sticker-notification"
import { StickerBook } from "@/components/sticker-book"

interface ColoringCanvasProps {
  page: {
    id: number
    src: string
    name: string
  }
  onBack: () => void
  characterColor?: string // Added optional character color prop
}

type BrushType = "crayon" | "glitter" | "laser"

const colors = [
  { name: "Magenta", value: "#FF1493", glitter: true },
  { name: "Lime", value: "#00FF00", glitter: false },
  { name: "Violet", value: "#9400D3", glitter: false },
  { name: "Silver", value: "#C0C0C0", glitter: true },
  { name: "Gold", value: "#FFD700", glitter: true },
  { name: "Red", value: "#FF0000", glitter: false },
  { name: "Peach", value: "#FFDAB9", glitter: false },
  { name: "White", value: "#FFFFFF", glitter: false },
]

export function ColoringCanvas({ page, onBack, characterColor }: ColoringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [brushType, setBrushType] = useState<BrushType>("crayon")
  const [isDrawing, setIsDrawing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [history, setHistory] = useState<ImageData[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [showCompletionEffect, setShowCompletionEffect] = useState(false)
  const [newSticker, setNewSticker] = useState<Sticker | null>(null)
  const [showStickerBook, setShowStickerBook] = useState(false)
  const lastSoundTimeRef = useRef(0)
  const hasUnlockedStickerRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const container = canvas.parentElement
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    const savedColoring = getSavedColoring(page.id)

    if (savedColoring) {
      const img = new window.Image()
      img.src = savedColoring.dataUrl
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        saveToHistory()
        setCompletionPercentage(savedColoring.completionPercentage)
      }
      img.onerror = () => {
        console.error("[v0] Failed to load saved coloring, loading fresh page")
        loadFreshPage()
      }
    } else {
      loadFreshPage()
    }

    function loadFreshPage() {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.src = page.src
      img.onload = () => {
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.95
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

        saveToHistory()
      }
      img.onerror = () => {
        console.error("[v0] Failed to load image:", page.src)
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#000000"
        ctx.font = "24px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("Image failed to load", canvas.width / 2, canvas.height / 2)
        ctx.fillText("Please try another page", canvas.width / 2, canvas.height / 2 + 30)
      }
    }
  }, [page.src, page.id])

  useEffect(() => {
    if (history.length > 0 && history.length % 10 === 0) {
      const canvas = canvasRef.current
      if (canvas) {
        const dataUrl = canvas.toDataURL()
        saveColoring(page.id, dataUrl, completionPercentage)
      }
    }
  }, [history.length, page.id, completionPercentage])

  const saveToHistory = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory((prev) => [...prev.slice(-9), imageData])

    calculateCompletion()
  }

  const calculateCompletion = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    let coloredPixels = 0
    let totalPixels = 0

    for (let i = 0; i < data.length; i += 40) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      if (a > 0) {
        totalPixels++
        if (r < 250 || g < 250 || b < 250) {
          coloredPixels++
        }
      }
    }

    const percentage = totalPixels > 0 ? (coloredPixels / totalPixels) * 100 : 0
    setCompletionPercentage(percentage)

    if (percentage >= 80 && !showCompletionEffect && !hasUnlockedStickerRef.current) {
      setShowCompletionEffect(true)
      soundEffects.playCrowdCheer()
      hasUnlockedStickerRef.current = true

      setTimeout(() => {
        const sticker = unlockRandomSticker()
        if (sticker) {
          setNewSticker(sticker)
        }
        setShowCompletionEffect(false)
      }, 2000)
    }
  }

  const undo = () => {
    if (history.length <= 1) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const newHistory = history.slice(0, -1)
    const previousState = newHistory[newHistory.length - 1]

    if (previousState) {
      ctx.putImageData(previousState, 0, 0)
      setHistory(newHistory)
      soundEffects.playWhoosh()
      calculateCompletion()
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.src = page.src
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.95
      const x = (canvas.width - img.width * scale) / 2
      const y = (canvas.height - img.height * scale) / 2

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      saveToHistory()
    }
    img.onerror = () => {
      console.error("[v0] Failed to reload image after clear")
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    setShowClearConfirm(false)
    soundEffects.playDemonVoice()
    setCompletionPercentage(0)
    setShowCompletionEffect(false)
    hasUnlockedStickerRef.current = false
  }

  const draw = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = selectedColor.value
      ctx.lineWidth = brushType === "laser" ? 3 : 20
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (brushType === "glitter") {
        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.random() - 0.5) * 10
          const offsetY = (Math.random() - 0.5) * 10
          ctx.fillStyle = selectedColor.value
          ctx.globalAlpha = Math.random() * 0.5 + 0.5
          ctx.fillRect(x + offsetX, y + offsetY, 4, 4)
        }
        ctx.globalAlpha = 1

        const now = Date.now()
        if (now - lastSoundTimeRef.current > 200) {
          soundEffects.playSparkle()
          lastSoundTimeRef.current = now
        }
      }

      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x, y)
    },
    [selectedColor, brushType],
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    draw(x, y)
  }

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveToHistory()
    }
  }

  const getCursorClass = () => {
    switch (brushType) {
      case "glitter":
        return "canvas-cursor-glitter"
      case "laser":
        return "canvas-cursor-laser"
      default:
        return "canvas-cursor-crayon"
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <StickerNotification sticker={newSticker} onClose={() => setNewSticker(null)} />

      <StickerBook isOpen={showStickerBook} onClose={() => setShowStickerBook(false)} />

      {showCompletionEffect && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl font-bold text-primary animate-bounce drop-shadow-2xl">Amazing Work!</div>
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: colors[Math.floor(Math.random() * colors.length)].value,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-14 h-14 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
          aria-label="Go home"
        >
          <Home className="w-6 h-6 text-primary-foreground" />
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setShowStickerBook(true)}
            className="w-14 h-14 bg-secondary hover:bg-secondary/80 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="View sticker collection"
          >
            <BookOpen className="w-6 h-6 text-secondary-foreground" />
          </button>

          <button
            onClick={undo}
            disabled={history.length <= 1}
            className="w-14 h-14 bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Undo"
          >
            <Undo2 className="w-6 h-6 text-accent-foreground" />
          </button>

          <button
            onClick={() => {
              setShowClearConfirm(true)
              soundEffects.playDemonVoice()
            }}
            className="w-14 h-14 bg-destructive hover:bg-destructive/80 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Clear all"
          >
            <Eraser className="w-6 h-6 text-destructive-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 pt-24 pb-32">
        <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`w-full h-full rounded-2xl shadow-2xl touch-none ${getCursorClass()}`}
          />
          {completionPercentage > 10 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-primary">
              <div className="text-sm font-bold text-foreground">{Math.round(completionPercentage)}% Complete</div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setBrushType("crayon")}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              brushType === "crayon"
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-muted text-muted-foreground hover:scale-105"
            }`}
          >
            Crayon
          </button>
          <button
            onClick={() => {
              setBrushType("glitter")
              soundEffects.playSparkle()
            }}
            className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
              brushType === "glitter"
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-muted text-muted-foreground hover:scale-105"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Glitter
          </button>
          <button
            onClick={() => {
              setBrushType("laser")
              soundEffects.playPowerChord()
            }}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              brushType === "laser"
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-muted text-muted-foreground hover:scale-105"
            }`}
          >
            Laser
          </button>
        </div>

        <div className="flex justify-center gap-3 flex-wrap max-w-2xl mx-auto">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                setSelectedColor(color)
                soundEffects.playLetsGo()
              }}
              className={`w-16 h-16 rounded-full transition-all hover:scale-110 active:scale-95 ${
                selectedColor.name === color.name ? "ring-4 ring-foreground scale-110" : "ring-2 ring-border"
              } ${color.glitter ? "glitter-effect" : ""}`}
              style={{ backgroundColor: color.value }}
              aria-label={`Select ${color.name}`}
            />
          ))}
        </div>
      </div>

      {showClearConfirm && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-30 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-card p-8 rounded-3xl border-4 border-destructive shadow-2xl max-w-md mx-4 animate-in zoom-in duration-300">
            <h3 className="text-3xl font-bold text-center mb-6">Erase it all?</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-4 bg-muted hover:bg-muted/80 text-muted-foreground rounded-full font-bold text-xl transition-all hover:scale-105 active:scale-95"
              >
                No, Keep It
              </button>
              <button
                onClick={clearCanvas}
                className="flex-1 py-4 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full font-bold text-xl transition-all hover:scale-105 active:scale-95"
              >
                Yes, Erase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
