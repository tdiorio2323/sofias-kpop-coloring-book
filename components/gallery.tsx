"use client"

import { useState, useEffect } from "react"
import { X, Download, Trash2, Star, Calendar } from "lucide-react"
import { getSavedColorings, type SavedColoring } from "@/lib/storage"
import { toast } from "sonner"

interface GalleryProps {
  isOpen: boolean
  onClose: () => void
  onOpenColoring?: (pageId: number) => void
}

export function Gallery({ isOpen, onClose, onOpenColoring }: GalleryProps) {
  const [savedColorings, setSavedColorings] = useState<SavedColoring[]>([])
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (isOpen) {
      const colorings = getSavedColorings()
      setSavedColorings(colorings.sort((a, b) => b.timestamp - a.timestamp))
      
      // Load favorites from localStorage
      try {
        const savedFavorites = localStorage.getItem('kpop-favorites')
        if (savedFavorites) {
          setFavorites(new Set(JSON.parse(savedFavorites)))
        }
      } catch (error) {
        console.error('Failed to load favorites:', error)
      }
    }
  }, [isOpen])

  const toggleFavorite = (pageId: number) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(pageId)) {
      newFavorites.delete(pageId)
      toast.info("Removed from favorites")
    } else {
      newFavorites.add(pageId)
      toast.success("Added to favorites! ⭐")
    }
    setFavorites(newFavorites)
    
    try {
      localStorage.setItem('kpop-favorites', JSON.stringify(Array.from(newFavorites)))
    } catch (error) {
      console.error('Failed to save favorites:', error)
      toast.error('Could not save favorite (storage full or private mode)')
    }
  }

  const downloadArtwork = (coloring: SavedColoring) => {
    const link = document.createElement("a")
    link.download = `artwork-${coloring.pageId}-${Date.now()}.png`
    link.href = coloring.dataUrl
    link.click()
    toast.success("Artwork downloaded!")
  }

  const deleteArtwork = (pageId: number) => {
    try {
      const colorings = getSavedColorings()
      const filtered = colorings.filter(c => c.pageId !== pageId)
      localStorage.setItem('kpop-colorings', JSON.stringify(filtered))
      setSavedColorings(filtered)
      toast.info("Artwork deleted")
    } catch (error) {
      console.error('Failed to delete artwork:', error)
      toast.error('Could not delete artwork (storage error)')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 overflow-y-auto animate-in fade-in duration-300">
      <div className="min-h-screen p-4 md:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                🎨 My Gallery
              </h2>
              <p className="text-lg text-muted-foreground">
                {savedColorings.length} artwork{savedColorings.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-14 h-14 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {savedColorings.length === 0 ? (
          <div className="max-w-7xl mx-auto">
            <div className="bg-card border-4 border-border rounded-3xl p-12 text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold mb-2">No Artwork Yet</h3>
              <p className="text-muted-foreground">
                Start coloring to see your amazing creations here!
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedColorings.map((coloring) => (
              <div
                key={coloring.pageId}
                className="group relative bg-card rounded-2xl overflow-hidden border-4 border-border hover:border-primary transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-primary/50"
              >
                {/* Artwork Image */}
                <div className="aspect-[3/4] relative">
                  <img
                    src={coloring.dataUrl}
                    alt={`Artwork ${coloring.pageId}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Favorite Star */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(coloring.pageId)
                    }}
                    className="absolute top-3 right-3 w-10 h-10 bg-background/80 hover:bg-background backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        favorites.has(coloring.pageId)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>

                  {/* Completion Badge */}
                  <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-primary-foreground">
                      {Math.round(coloring.completionPercentage)}%
                    </span>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                    <div className="flex gap-2 w-full">
                      {onOpenColoring && (
                        <button
                          onClick={() => {
                            onOpenColoring(coloring.pageId)
                            onClose()
                          }}
                          className="flex-1 py-3 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full font-bold transition-all hover:scale-105 active:scale-95"
                        >
                          Continue
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadArtwork(coloring)
                        }}
                        className="w-12 h-12 bg-accent hover:bg-accent/80 text-accent-foreground rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                        aria-label="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Delete this artwork?')) {
                            deleteArtwork(coloring.pageId)
                          }
                        }}
                        className="w-12 h-12 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="p-4 bg-card border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(coloring.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        {savedColorings.length > 0 && (
          <div className="max-w-7xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border-2 border-border rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{savedColorings.length}</div>
              <div className="text-sm text-muted-foreground">Total Artworks</div>
            </div>
            <div className="bg-card border-2 border-border rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-2">
                {savedColorings.filter(c => c.completionPercentage >= 80).length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="bg-card border-2 border-border rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-accent mb-2">
                {favorites.size}
              </div>
              <div className="text-sm text-muted-foreground">Favorites</div>
            </div>
            <div className="bg-card border-2 border-border rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-chart-4 mb-2">
                {Math.round(
                  savedColorings.reduce((sum, c) => sum + c.completionPercentage, 0) /
                    savedColorings.length
                )}%
              </div>
              <div className="text-sm text-muted-foreground">Avg. Completion</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

