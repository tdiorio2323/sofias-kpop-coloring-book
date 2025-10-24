// Local storage utilities for saving coloring progress and stickers

export interface SavedColoring {
  pageId: number
  dataUrl: string
  timestamp: number
  completionPercentage: number
}

export interface Sticker {
  id: string
  name: string
  emoji: string
  unlockedAt: number
}

export interface CompressedSnapshot {
  pageId: number
  dataUrl: string // WebP compressed base64
  timestamp: number
  width: number
  height: number
  bytes: number
}

const STORAGE_KEYS = {
  COLORINGS: "kpop-colorings",
  STICKERS: "kpop-stickers",
}

// Save coloring progress
export function saveColoring(pageId: number, dataUrl: string, completionPercentage: number) {
  try {
    const saved = getSavedColorings()
    const existing = saved.find((s) => s.pageId === pageId)

    if (existing) {
      existing.dataUrl = dataUrl
      existing.timestamp = Date.now()
      existing.completionPercentage = completionPercentage
    } else {
      saved.push({
        pageId,
        dataUrl,
        timestamp: Date.now(),
        completionPercentage,
      })
    }

    localStorage.setItem(STORAGE_KEYS.COLORINGS, JSON.stringify(saved))
  } catch (error) {
    console.error("[v0] Failed to save coloring:", error)
  }
}

// Get all saved colorings
export function getSavedColorings(): SavedColoring[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.COLORINGS)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error("[v0] Failed to load colorings:", error)
    return []
  }
}

// Get saved coloring for specific page
export function getSavedColoring(pageId: number): SavedColoring | null {
  const saved = getSavedColorings()
  return saved.find((s) => s.pageId === pageId) || null
}

// Sticker management
const AVAILABLE_STICKERS: Omit<Sticker, "unlockedAt">[] = [
  { id: "microphone", name: "Microphone Master", emoji: "🎤" },
  { id: "star", name: "Rising Star", emoji: "⭐" },
  { id: "fire", name: "On Fire", emoji: "🔥" },
  { id: "crown", name: "Coloring Queen", emoji: "👑" },
  { id: "sparkles", name: "Sparkle Pro", emoji: "✨" },
  { id: "heart", name: "Heart Warrior", emoji: "💖" },
  { id: "lightning", name: "Lightning Fast", emoji: "⚡" },
  { id: "rainbow", name: "Rainbow Artist", emoji: "🌈" },
  { id: "trophy", name: "Champion", emoji: "🏆" },
  { id: "demon", name: "Demon Hunter", emoji: "👹" },
]

export function getUnlockedStickers(): Sticker[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STICKERS)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error("[v0] Failed to load stickers:", error)
    return []
  }
}

export function unlockRandomSticker(): Sticker | null {
  try {
    const unlocked = getUnlockedStickers()
    const unlockedIds = new Set(unlocked.map((s) => s.id))
    const available = AVAILABLE_STICKERS.filter((s) => !unlockedIds.has(s.id))

    if (available.length === 0) return null

    const randomSticker = available[Math.floor(Math.random() * available.length)]
    const newSticker: Sticker = {
      ...randomSticker,
      unlockedAt: Date.now(),
    }

    unlocked.push(newSticker)
    localStorage.setItem(STORAGE_KEYS.STICKERS, JSON.stringify(unlocked))

    return newSticker
  } catch (error) {
    console.error("[v0] Failed to unlock sticker:", error)
    return null
  }
}

// Save compressed canvas snapshot
import { idbSet, idbGet, compressCanvas, blobToBase64 } from "./idb-storage"

export async function saveCompressedSnapshot(pageId: number, canvas: HTMLCanvasElement): Promise<void> {
  try {
    const blob = await compressCanvas(canvas, 0.9)
    const dataUrl = await blobToBase64(blob)

    const snapshot: CompressedSnapshot = {
      pageId,
      dataUrl,
      timestamp: Date.now(),
      width: canvas.width,
      height: canvas.height,
      bytes: blob.size,
    }

    await idbSet(`snapshot-${pageId}`, snapshot)
    console.info(`[v0] Saved compressed snapshot: ${(blob.size / 1024).toFixed(1)}KB`)
  } catch (error) {
    console.error("[v0] Failed to save compressed snapshot:", error)
  }
}

// Load compressed snapshot
export async function loadCompressedSnapshot(pageId: number): Promise<CompressedSnapshot | null> {
  try {
    const snapshot = await idbGet<CompressedSnapshot>(`snapshot-${pageId}`)
    return snapshot || null
  } catch (error) {
    console.error("[v0] Failed to load compressed snapshot:", error)
    return null
  }
}
