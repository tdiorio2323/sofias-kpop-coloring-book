// IndexedDB storage utilities with localStorage fallback
// Uses idb-keyval pattern for simple key-value storage

const DB_NAME = "kpop-coloring-db"
const STORE_NAME = "drawings"
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })

  return dbPromise
}

export async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(value, key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn("[v0] IndexedDB unavailable, falling back to localStorage:", error)
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn("[v0] IndexedDB unavailable, falling back to localStorage:", error)
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : undefined
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn("[v0] IndexedDB unavailable, falling back to localStorage:", error)
    localStorage.removeItem(key)
  }
}

// Compress canvas to WebP blob
export async function compressCanvas(canvas: HTMLCanvasElement, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to compress canvas"))
      },
      "image/webp",
      quality,
    )
  })
}

// Convert blob to base64 for storage
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Convert base64 to blob
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(",")
  const contentType = parts[0].match(/:(.*?);/)?.[1] || "image/webp"
  const raw = atob(parts[1])
  const array = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    array[i] = raw.charCodeAt(i)
  }
  return new Blob([array], { type: contentType })
}
