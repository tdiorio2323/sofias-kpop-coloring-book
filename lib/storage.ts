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
