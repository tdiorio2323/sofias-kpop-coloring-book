"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { Home, Undo2, Redo2, Eraser, Sparkles, BookOpen, Download } from "lucide-react"
import { soundEffects } from "@/lib/sound-effects"
import {
  saveColoring,
  getSavedColoring,
  unlockRandomSticker,
  saveCompressedSnapshot,
  loadCompressedSnapshot,
} from "@/lib/storage"
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
  characterColor?: string
}

type BrushType = "crayon" | "glitter" | "laser" | "eraser"

interface ExportOptions {
  transparent?: boolean
  filenameBase?: string
}

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
  const containerRef = useRef<HTMLDivElement>(null)

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const rafIdRef = useRef<number | undefined>()
  const pointsRef = useRef<{ x: number; y: number }[]>([])
  const activePointerIdRef = useRef<number | null>(null)
  const fpsFramesRef = useRef<number[]>([])
  const lastFrameTimeRef = useRef(Date.now())
  const glitterCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [brushType, setBrushType] = useState<BrushType>("crayon")
  const [brushSize, setBrushSize] = useState(20)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const [history, setHistory] = useState<string[]>([]) // Store compressed base64 strings
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [showCompletionEffect, setShowCompletionEffect] = useState(false)
  const [newSticker, setNewSticker] = useState<Sticker | null>(null)
  const [showStickerBook, setShowStickerBook] = useState(false)
  const lastSoundTimeRef = useRef(0)
  const hasUnlockedStickerRef = useRef(false)

  useEffect(() => {
    const glitterCanvas = document.createElement("canvas")
    glitterCanvas.width = 20
    glitterCanvas.height = 20
    const glitterCtx = glitterCanvas.getContext("2d")

    if (glitterCtx) {
      // Pre-render glitter sparkles
      for (let i = 0; i < 5; i++) {
        glitterCtx.fillStyle = "rgba(255, 255, 255, 0.8)"
        glitterCtx.fillRect(Math.random() * 20, Math.random() * 20, 2, 2)
      }
    }

    glitterCanvasRef.current = glitterCanvas
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    ctxRef.current = ctx

    const container = containerRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    loadCompressedSnapshot(page.id).then((snapshot) => {
      if (snapshot) {
        const img = new window.Image()
        img.src = snapshot.dataUrl
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
          saveToHistory()
          console.info(`[v0] Loaded compressed snapshot: ${(snapshot.bytes / 1024).toFixed(1)}KB`)
        }
        img.onerror = () => {
          console.error("[v0] Failed to load compressed snapshot, loading fresh page")
          loadFreshPage()
        }
      } else {
        // Fallback to old localStorage method
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
      }
    })

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

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [page.src, page.id])

  useEffect(() => {
    if (history.length > 0 && history.length % 10 === 0) {
      const canvas = canvasRef.current
      if (canvas) {
        saveCompressedSnapshot(page.id, canvas)

        // Also save to old format for compatibility
        const dataUrl = canvas.toDataURL()
        saveColoring(page.id, dataUrl, completionPercentage)
      }
    }
  }, [history.length, page.id, completionPercentage])

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob(
      (blob) => {
        if (!blob) return

        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1)
            newHistory.push(base64)
            // Keep last 50 snapshots
            return newHistory.slice(-50)
          })
          setHistoryIndex((prev) => Math.min(prev + 1, 49))
        }
        reader.readAsDataURL(blob)
      },
      "image/webp",
      0.9,
    )

    setTimeout(() => calculateCompletion(), 500)
  }, [historyIndex])

  const calculateCompletion = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = ctxRef.current
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    let coloredPixels = 0
    let totalPixels = 0

    for (let i = 0; i < data.length; i += 160) {
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
  }, [showCompletionEffect])

  const undo = useCallback(() => {
    if (historyIndex <= 0) return

    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    const newIndex = historyIndex - 1
    const previousState = history[newIndex]

    if (previousState) {
      const img = new window.Image()
      img.src = previousState
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        setHistoryIndex(newIndex)
        soundEffects.playWhoosh()
        calculateCompletion()
      }
    }
  }, [history, historyIndex, calculateCompletion])

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return

    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    const newIndex = historyIndex + 1
    const nextState = history[newIndex]

    if (nextState) {
      const img = new window.Image()
      img.src = nextState
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        setHistoryIndex(newIndex)
        soundEffects.playWhoosh()
        calculateCompletion()
      }
    }
  }, [history, historyIndex, calculateCompletion])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

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

  const exportImage = useCallback(
    (opts?: ExportOptions) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const filenameBase = opts?.filenameBase || page.name
      const timestamp = Date.now()
      const filename = `${filenameBase}-${timestamp}.png`

      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("[v0] Failed to export image")
          return
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)

        soundEffects.playLetsGo()
        console.info(`[v0] Exported image: ${filename} (${(blob.size / 1024).toFixed(1)}KB)`)
      }, "image/png")
    },
    [page.name],
  )

  const trackFPS = useCallback(() => {
    const now = Date.now()
    const delta = now - lastFrameTimeRef.current
    const fps = 1000 / delta

    fpsFramesRef.current.push(fps)
    if (fpsFramesRef.current.length > 60) {
      fpsFramesRef.current.shift()
    }

    lastFrameTimeRef.current = now

    // Log average FPS every 60 frames
    if (fpsFramesRef.current.length === 60) {
      const avgFPS = fpsFramesRef.current.reduce((a, b) => a + b, 0) / 60
      console.info(`[canvas] avgFPS=${avgFPS.toFixed(1)}`)
    }
  }, [])

  const draw = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) return

      trackFPS()

      // Add point to buffer
      pointsRef.current.push({ x, y })

      if (brushType === "eraser") {
        ctx.globalCompositeOperation = "destination-out"
        ctx.strokeStyle = "rgba(0,0,0,1)"
      } else {
        ctx.globalCompositeOperation = "source-over"
        ctx.strokeStyle = selectedColor.value
      }

      ctx.lineWidth = brushType === "laser" ? Math.max(3, brushSize / 4) : brushSize
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (brushType === "glitter" && glitterCanvasRef.current) {
        ctx.save()
        ctx.globalAlpha = 0.8
        ctx.drawImage(glitterCanvasRef.current, x - 10, y - 10)
        ctx.restore()

        const now = Date.now()
        if (now - lastSoundTimeRef.current > 200) {
          soundEffects.playSparkle()
          lastSoundTimeRef.current = now
        }
      }

      const points = pointsRef.current
      if (points.length < 3) {
        // Not enough points for smoothing, draw straight line
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y)
      } else {
        // Use quadratic curves for smoothing
        const p1 = points[points.length - 2]
        const p2 = points[points.length - 1]
        const midPoint = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        }

        ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(midPoint.x, midPoint.y)

        // Keep buffer size manageable
        if (points.length > 8) {
          pointsRef.current = points.slice(-4)
        }
      }
    },
    [selectedColor, brushType, brushSize, trackFPS],
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Reject additional touches
    if (activePointerIdRef.current !== null) return

    activePointerIdRef.current = e.pointerId

    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    pointsRef.current = [{ x, y }]

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    if (e.pointerId !== activePointerIdRef.current) return

    // Ignore if RAF already queued
    if (rafIdRef.current) return

    rafIdRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      draw(x, y)
      rafIdRef.current = undefined
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return

    if (isDrawing) {
      setIsDrawing(false)
      activePointerIdRef.current = null
      pointsRef.current = []
      saveToHistory()
    }
  }

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return

    setIsDrawing(false)
    activePointerIdRef.current = null
    pointsRef.current = []
  }

  const getCursorClass = () => {
    switch (brushType) {
      case "glitter":
        return "canvas-cursor-glitter"
      case "laser":
        return "canvas-cursor-laser"
      case "eraser":
        return "cursor-crosshair"
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
            onClick={() => exportImage()}
            className="w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Export PNG"
            id="export"
          >
            <Download className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={() => setShowStickerBook(true)}
            className="w-14 h-14 bg-secondary hover:bg-secondary/80 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="View sticker collection"
          >
            <BookOpen className="w-6 h-6 text-secondary-foreground" />
          </button>

          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="w-14 h-14 bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Undo"
          >
            <Undo2 className="w-6 h-6 text-accent-foreground" />
          </button>

          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="w-14 h-14 bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Redo"
          >
            <Redo2 className="w-6 h-6 text-accent-foreground" />
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
        <div ref={containerRef} className="relative w-full h-full max-w-4xl max-h-[80vh]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerCancel}
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
        <div className="flex justify-center items-center gap-4 mb-4">
          <span className="text-sm font-medium text-foreground">Brush Size:</span>
          <input
            type="range"
            min="1"
            max="60"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-48 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="text-sm font-medium text-foreground w-8">{brushSize}</span>
        </div>

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
          <button
            onClick={() => setBrushType("eraser")}
            className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
              brushType === "eraser"
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-muted text-muted-foreground hover:scale-105"
            }`}
          >
            <Eraser className="w-4 h-4" />
            Eraser
          </button>
        </div>

        <div className="flex justify-center gap-3 flex-wrap max-w-2xl mx-auto">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                setSelectedColor(color)
                setBrushType("crayon") // Switch back to crayon when selecting color
                soundEffects.playLetsGo()
              }}
              className={`w-16 h-16 rounded-full transition-all hover:scale-110 active:scale-95 ${
                selectedColor.name === color.name && brushType !== "eraser"
                  ? "ring-4 ring-foreground scale-110"
                  : "ring-2 ring-border"
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
