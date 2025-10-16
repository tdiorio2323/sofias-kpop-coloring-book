"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { Home, Undo2, Eraser, Sparkles, BookOpen, Download, Minus, Plus, Eye, EyeOff, Keyboard, Images, Droplet } from "lucide-react"
import { toast } from "sonner"
import { soundEffects } from "@/lib/sound-effects"
import { saveColoring, getSavedColoring, unlockRandomSticker } from "@/lib/storage"
import type { Sticker } from "@/lib/storage"
import { StickerNotification } from "@/components/sticker-notification"
import { StickerBook } from "@/components/sticker-book"
import { Gallery } from "@/components/gallery"

interface ColoringCanvasProps {
  page: {
    id: number
    src: string
    name: string
  }
  onBack: () => void
  characterColor?: string // Added optional character color prop
}

type BrushType = "crayon" | "glitter" | "laser" | "bucket"

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
  const [brushSize, setBrushSize] = useState(20)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [history, setHistory] = useState<ImageData[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [showCompletionEffect, setShowCompletionEffect] = useState(false)
  const [newSticker, setNewSticker] = useState<Sticker | null>(null)
  const [showStickerBook, setShowStickerBook] = useState(false)
  const [useOutlineMode, setUseOutlineMode] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
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
        if (!ctx || !canvas) return

        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2

        if (useOutlineMode) {
          setIsProcessing(true)
          // Create temporary canvas for edge detection
          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = img.width
          tempCanvas.height = img.height
          const tempCtx = tempCanvas.getContext("2d")
          
          if (tempCtx) {
            // Draw image
            tempCtx.drawImage(img, 0, 0)
            
            // Get image data for edge detection
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
            const data = imageData.data
            
            // Convert to grayscale and enhance edges
            for (let i = 0; i < data.length; i += 4) {
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
              data[i] = gray
              data[i + 1] = gray
              data[i + 2] = gray
            }
            
            // Apply edge detection (simple Sobel-like filter)
            const edgeData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height)
            for (let y = 1; y < tempCanvas.height - 1; y++) {
              for (let x = 1; x < tempCanvas.width - 1; x++) {
                const idx = (y * tempCanvas.width + x) * 4
                const gx =
                  -1 * data[idx - tempCanvas.width * 4 - 4] +
                  1 * data[idx - tempCanvas.width * 4 + 4] +
                  -2 * data[idx - 4] +
                  2 * data[idx + 4] +
                  -1 * data[idx + tempCanvas.width * 4 - 4] +
                  1 * data[idx + tempCanvas.width * 4 + 4]
                
                const gy =
                  -1 * data[idx - tempCanvas.width * 4 - 4] +
                  -2 * data[idx - tempCanvas.width * 4] +
                  -1 * data[idx - tempCanvas.width * 4 + 4] +
                  1 * data[idx + tempCanvas.width * 4 - 4] +
                  2 * data[idx + tempCanvas.width * 4] +
                  1 * data[idx + tempCanvas.width * 4 + 4]
                
                const magnitude = Math.sqrt(gx * gx + gy * gy)
                const edge = magnitude > 50 ? 0 : 255 // Black lines, white background
                
                edgeData.data[idx] = edge
                edgeData.data[idx + 1] = edge
                edgeData.data[idx + 2] = edge
                edgeData.data[idx + 3] = 255
              }
            }
            
            tempCtx.putImageData(edgeData, 0, 0)
            ctx.drawImage(tempCanvas, x, y, img.width * scale, img.height * scale)
            setIsProcessing(false)
          } else {
            setIsProcessing(false)
          }
        } else {
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
        }

        saveToHistory()
      }
      img.onerror = () => {
        console.error("[v0] Failed to load image:", page.src)
        if (ctx && canvas) {
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = "#000000"
          ctx.font = "24px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText("Image failed to load", canvas.width / 2, canvas.height / 2)
          ctx.fillText("Please try another page", canvas.width / 2, canvas.height / 2 + 30)
        }
        setIsProcessing(false)
      }
    }
  }, [page.src, page.id, useOutlineMode])

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
    if (history.length <= 1) {
      toast.error("Nothing to undo")
      return
    }

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
      toast.success("Undone")
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

      const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
      const x = (canvas.width - img.width * scale) / 2
      const y = (canvas.height - img.height * scale) / 2

      if (useOutlineMode) {
        setIsProcessing(true)
        // Apply same edge detection as in loadFreshPage
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = img.width
        tempCanvas.height = img.height
        const tempCtx = tempCanvas.getContext("2d")

        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0)
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
          const data = imageData.data

          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
            data[i] = gray
            data[i + 1] = gray
            data[i + 2] = gray
          }

          const edgeData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height)
          for (let y = 1; y < tempCanvas.height - 1; y++) {
            for (let x = 1; x < tempCanvas.width - 1; x++) {
              const idx = (y * tempCanvas.width + x) * 4
              const gx =
                -1 * data[idx - tempCanvas.width * 4 - 4] +
                1 * data[idx - tempCanvas.width * 4 + 4] +
                -2 * data[idx - 4] +
                2 * data[idx + 4] +
                -1 * data[idx + tempCanvas.width * 4 - 4] +
                1 * data[idx + tempCanvas.width * 4 + 4]

              const gy =
                -1 * data[idx - tempCanvas.width * 4 - 4] +
                -2 * data[idx - tempCanvas.width * 4] +
                -1 * data[idx - tempCanvas.width * 4 + 4] +
                1 * data[idx + tempCanvas.width * 4 - 4] +
                2 * data[idx + tempCanvas.width * 4] +
                1 * data[idx + tempCanvas.width * 4 + 4]

              const magnitude = Math.sqrt(gx * gx + gy * gy)
              const edge = magnitude > 50 ? 0 : 255

              edgeData.data[idx] = edge
              edgeData.data[idx + 1] = edge
              edgeData.data[idx + 2] = edge
              edgeData.data[idx + 3] = 255
            }
          }

          tempCtx.putImageData(edgeData, 0, 0)
          ctx.drawImage(tempCanvas, x, y, img.width * scale, img.height * scale)
          setIsProcessing(false)
        } else {
          setIsProcessing(false)
        }
      } else {
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      }

      saveToHistory()
    }
    img.onerror = () => {
      console.error("[v0] Failed to reload image after clear")
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setIsProcessing(false)
    }

    setShowClearConfirm(false)
    soundEffects.playDemonVoice()
    setCompletionPercentage(0)
    setShowCompletionEffect(false)
    hasUnlockedStickerRef.current = false
    toast.info("Canvas cleared", {
      description: "Start fresh with a clean canvas!",
    })
  }

  const draw = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = selectedColor.value
      ctx.lineWidth = brushType === "laser" ? brushSize / 2 : brushSize
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
    [selectedColor, brushType, brushSize],
  )

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create a temporary link to download
    const link = document.createElement("a")
    const filename = `${page.name.toLowerCase().replace(/\s+/g, "-")}-colored.png`
    link.download = filename
    link.href = canvas.toDataURL("image/png")
    link.click()

    soundEffects.playLetsGo()
    toast.success("Artwork downloaded!", {
      description: `Saved as ${filename}`,
      duration: 3000,
    })
  }

  const bucketFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    const targetColor = getColorAtPixel(data, startX, startY, canvas.width)
    const fillColor = hexToRgb(selectedColor.value)

    // Don't fill if clicking on same color
    if (colorsMatch(targetColor, fillColor)) return

    const stack: [number, number][] = [[startX, startY]]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`

      if (visited.has(key)) continue
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue

      visited.add(key)

      const currentColor = getColorAtPixel(data, x, y, canvas.width)
      if (!colorsMatch(currentColor, targetColor)) continue

      // Fill this pixel
      setColorAtPixel(data, x, y, fillColor, canvas.width)

      // Add neighbors to stack
      stack.push([x + 1, y])
      stack.push([x - 1, y])
      stack.push([x, y + 1])
      stack.push([x, y - 1])
    }

    ctx.putImageData(imageData, 0, 0)
    saveToHistory()
    toast.success("Area filled!", { duration: 1500 })
  }

  const getColorAtPixel = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const index = (Math.floor(y) * width + Math.floor(x)) * 4
    return {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
      a: data[index + 3],
    }
  }

  const setColorAtPixel = (
    data: Uint8ClampedArray,
    x: number,
    y: number,
    color: { r: number; g: number; b: number },
    width: number,
  ) => {
    const index = (Math.floor(y) * width + Math.floor(x)) * 4
    data[index] = color.r
    data[index + 1] = color.g
    data[index + 2] = color.b
    data[index + 3] = 255
  }

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }

  const colorsMatch = (
    c1: { r: number; g: number; b: number; a?: number },
    c2: { r: number; g: number; b: number; a?: number },
  ) => {
    return Math.abs(c1.r - c2.r) < 10 && Math.abs(c1.g - c2.g) < 10 && Math.abs(c1.b - c2.b) < 10
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Bucket fill mode - click to fill
    if (brushType === "bucket") {
      bucketFill(Math.floor(x), Math.floor(y))
      soundEffects.playSparkle()
      return
    }

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
      case "bucket":
        return "cursor-pointer"
      default:
        return "canvas-cursor-crayon"
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default browser shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 's')) {
        e.preventDefault()
      }

      // Ctrl+Z / Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo()
      }

      // Ctrl+S / Cmd+S - Download
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        downloadImage()
      }

      // + / = - Increase brush size
      if (e.key === '+' || e.key === '=') {
        if (brushSize < 50) {
          setBrushSize(Math.min(50, brushSize + 5))
          toast.success(`Brush size: ${Math.min(50, brushSize + 5)}`)
        }
      }

      // - - Decrease brush size
      if (e.key === '-' || e.key === '_') {
        if (brushSize > 5) {
          setBrushSize(Math.max(5, brushSize - 5))
          toast.success(`Brush size: ${Math.max(5, brushSize - 5)}`)
        }
      }

      // 1-8 - Select colors
      const num = parseInt(e.key)
      if (num >= 1 && num <= 8 && !e.ctrlKey && !e.metaKey) {
        setSelectedColor(colors[num - 1])
        soundEffects.playLetsGo()
        toast.success(`${colors[num - 1].name} selected`)
      }

      // B - Cycle through brush types
      if (e.key === 'b' || e.key === 'B') {
        const brushTypes: BrushType[] = ['crayon', 'glitter', 'laser', 'bucket']
        const currentIndex = brushTypes.indexOf(brushType)
        const nextIndex = (currentIndex + 1) % brushTypes.length
        const nextBrush = brushTypes[nextIndex]
        setBrushType(nextBrush)
        soundEffects.playWhoosh()
        toast.success(`${nextBrush.charAt(0).toUpperCase() + nextBrush.slice(1)} brush`)
      }

      // E - Toggle outline mode
      if (e.key === 'e' || e.key === 'E') {
        setUseOutlineMode(!useOutlineMode)
        soundEffects.playWhoosh()
        toast.info(!useOutlineMode ? "Outline mode" : "Photo mode")
      }

      // G - Open gallery
      if (e.key === 'g' || e.key === 'G') {
        setShowGallery(!showGallery)
      }

      // ? - Show keyboard shortcuts help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowKeyboardHelp(!showKeyboardHelp)
      }

      // Escape - Close help dialog
      if (e.key === 'Escape' && showKeyboardHelp) {
        setShowKeyboardHelp(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [brushSize, brushType, selectedColor, useOutlineMode, showKeyboardHelp, undo, downloadImage])

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <StickerNotification sticker={newSticker} onClose={() => setNewSticker(null)} />

      <StickerBook isOpen={showStickerBook} onClose={() => setShowStickerBook(false)} />

      <Gallery isOpen={showGallery} onClose={() => setShowGallery(false)} />

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
            onClick={() => {
              const newMode = !useOutlineMode
              setUseOutlineMode(newMode)
              soundEffects.playWhoosh()
              toast.info(newMode ? "Outline mode enabled" : "Photo mode enabled", {
                description: newMode ? "Best for coloring!" : "Original image view",
                duration: 2000,
              })
            }}
            className={`w-14 h-14 ${
              useOutlineMode ? "bg-primary hover:bg-primary/80" : "bg-muted hover:bg-muted/80"
            } rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95`}
            aria-label={useOutlineMode ? "Show photo mode" : "Show outline mode"}
            title={useOutlineMode ? "Outline Mode (Good for Coloring)" : "Photo Mode"}
          >
            {useOutlineMode ? (
              <Eye className="w-6 h-6 text-primary-foreground" />
            ) : (
              <EyeOff className="w-6 h-6 text-muted-foreground" />
            )}
          </button>

          <button
            onClick={downloadImage}
            className="w-14 h-14 bg-chart-4 hover:bg-chart-4/80 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Download artwork"
          >
            <Download className="w-6 h-6 text-primary-foreground" />
          </button>

          <button
            onClick={() => setShowGallery(true)}
            className="w-14 h-14 bg-chart-5 hover:bg-chart-5/80 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="View gallery"
            title="My Gallery"
          >
            <Images className="w-6 h-6 text-primary-foreground" />
          </button>

          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="w-14 h-14 bg-chart-3 hover:bg-chart-3/80 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Keyboard shortcuts"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-6 h-6 text-primary-foreground" />
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
            aria-label="coloring-canvas"
          />
          
          {/* Loading Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-30">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-lg font-bold text-foreground">Processing image...</p>
                <p className="text-sm text-muted-foreground">Converting to coloring outline</p>
              </div>
            </div>
          )}
          
          {completionPercentage > 10 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-primary">
              <div className="text-sm font-bold text-foreground">{Math.round(completionPercentage)}% Complete</div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => {
              setBrushType("crayon")
              toast.success("Crayon brush selected", {
                description: "Standard smooth coloring",
                duration: 2000,
              })
            }}
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
              toast.success("✨ Glitter brush selected", {
                description: "Sparkly magical effects!",
                duration: 2000,
              })
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
              toast.success("Laser brush selected", {
                description: "Thin, precise lines",
                duration: 2000,
              })
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
            onClick={() => {
              setBrushType("bucket")
              soundEffects.playLetsGo()
              toast.success("🪣 Bucket fill selected", {
                description: "Click to fill enclosed areas!",
                duration: 2000,
              })
            }}
            className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${
              brushType === "bucket"
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-muted text-muted-foreground hover:scale-105"
            }`}
          >
            <Droplet className="w-4 h-4" />
            Bucket
          </button>

          {/* Brush size controls */}
          <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
            <button
              onClick={() => {
                setBrushSize(Math.max(5, brushSize - 5))
                soundEffects.playWhoosh()
              }}
              disabled={brushSize <= 5}
              className="w-8 h-8 bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              aria-label="Decrease brush size"
            >
              <Minus className="w-4 h-4 text-accent-foreground" />
            </button>
            <span className="text-sm font-bold text-muted-foreground min-w-[60px] text-center">
              Size: {brushSize}
            </span>
            <button
              onClick={() => {
                setBrushSize(Math.min(50, brushSize + 5))
                soundEffects.playWhoosh()
              }}
              disabled={brushSize >= 50}
              className="w-8 h-8 bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              aria-label="Increase brush size"
            >
              <Plus className="w-4 h-4 text-accent-foreground" />
            </button>
          </div>
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

      {showKeyboardHelp && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-30 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-card p-8 rounded-3xl border-4 border-primary shadow-2xl max-w-2xl mx-4 max-h-[80vh] overflow-y-auto animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold">⌨️ Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-border">
                <div className="font-bold text-primary">Shortcut</div>
                <div className="font-bold text-primary">Action</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <kbd className="px-3 py-2 bg-muted rounded-lg font-mono text-center">Ctrl + Z</kbd>
                <div className="flex items-center">Undo last stroke</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <kbd className="px-3 py-2 bg-muted rounded-lg font-mono text-center">Ctrl + S</kbd>
                <div className="flex items-center">Download artwork</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <kbd className="px-3 py-2 bg-muted rounded-lg font-mono text-center">+</kbd>
                <div className="flex items-center">Increase brush size</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <kbd className="px-3 py-2 bg-muted rounded-lg font-mono text-center">-</kbd>
                <div className="flex items-center">Decrease brush size</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <kbd className="px-3 py-2 bg-muted rounded-lg font-mono text-center">1-8</kbd>
                <div className="flex items-center">Select color (1=Magenta, 2=Lime, etc.)</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <kbd className="px-3 py-2 bg-muted rounded-lg font-mono text-center">B</kbd>
                <div className="flex items-center">Cycle brush type (Crayon/Glitter/Laser/Bucket)</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <kbd className="px-3 py-2 bg-muted rounded-lg font-mono text-center">E</kbd>
                <div className="flex items-center">Toggle outline/photo mode</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <kbd className="px-3 py-2 bg-muted rounded-lg font-mono text-center">G</kbd>
                <div className="flex items-center">Open gallery</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <kbd className="px-3 py-2 bg-muted rounded-lg font-mono text-center">?</kbd>
                <div className="flex items-center">Show this help</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <kbd className="px-3 py-2 bg-muted rounded-lg font-mono text-center">Esc</kbd>
                <div className="flex items-center">Close dialogs</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="px-6 py-3 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full font-bold transition-all hover:scale-105 active:scale-95"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
