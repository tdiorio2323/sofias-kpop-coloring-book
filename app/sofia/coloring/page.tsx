"use client"

import { useState, useEffect } from "react"
import { ColoringCanvas } from "@/components/coloring-canvas"
import { ArrowLeft, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

// All available K-Pop Demon Hunters coloring pages
const coloringPages = [
  { id: 1, src: "/images/coloring-pages/singers-stage.jpg", name: "Singing Squad", character: "rumi" },
  { id: 2, src: "/images/coloring-pages/tiger-beam.jpg", name: "Tiger Power", character: "bear" },
  { id: 3, src: "/images/coloring-pages/laptop-friends.jpg", name: "Laptop Friends", character: "celine" },
  { id: 4, src: "/images/coloring-pages/squad-sitting.jpg", name: "Squad Goals", character: "zoey" },
  { id: 5, src: "/images/coloring-pages/concert-crowd.jpg", name: "Concert Time", character: "rumi" },
  { id: 6, src: "/images/coloring-pages/demon-hunters-action.jpg", name: "Demon Hunters", character: "mira" },
  { id: 7, src: "/images/coloring-pages/demon-hunters-weapons.jpg", name: "Battle Ready", character: "mira" },
]

// Character colors for themed experiences
const characterColors: Record<string, string> = {
  rumi: "#FF1493",
  mira: "#00FF00",
  zoey: "#FFD700",
  celine: "#9370DB",
  bear: "#FFA500",
}

export default function SofiaColoringPage() {
  const router = useRouter()
  const [selectedPage, setSelectedPage] = useState<typeof coloringPages[0] | null>(null)
  const [sparkles, setSparkles] = useState<Array<{ left: number; top: number; delay: number }>>([])

  useEffect(() => {
    // Generate sparkles on client side only to avoid hydration mismatch
    setSparkles(
      Array.from({ length: 50 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
      })),
    )
  }, [])

  if (selectedPage) {
    return (
      <ColoringCanvas
        page={selectedPage}
        onBack={() => setSelectedPage(null)}
        characterColor={characterColors[selectedPage.character]}
      />
    )
  }

  return (
    <div className="min-h-screen cosmic-background relative overflow-hidden">
      {/* Animated sparkles overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {sparkles.map((sparkle, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/80 rounded-full glitter-effect"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Back button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-6 py-3 bg-primary/90 hover:bg-primary backdrop-blur-sm text-primary-foreground rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">Back to Characters</span>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pt-24">
        {/* Title section */}
        <div className="text-center mb-12 max-w-4xl">
          <div className="inline-flex items-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            <h1 className="text-5xl md:text-7xl font-bold text-foreground drop-shadow-2xl">
              Sofia's Coloring Studio
            </h1>
            <Sparkles className="w-10 h-10 text-secondary animate-pulse" />
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground drop-shadow-lg">
            Choose a K-Pop Demon Hunters scene to color!
          </p>
        </div>

        {/* Coloring pages grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl w-full">
          {coloringPages.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden border-4 border-border hover:border-primary transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-primary/50"
            >
              {/* Page thumbnail */}
              <div className="absolute inset-0 bg-card">
                <img
                  src={page.src}
                  alt={page.name}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <h3 className="text-lg font-bold text-foreground mb-1">{page.name}</h3>
                  <p className="text-sm text-muted-foreground">Click to color!</p>
                </div>
              </div>

              {/* Character color indicator */}
              <div
                className="absolute top-3 right-3 w-8 h-8 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: characterColors[page.character] }}
              />

              {/* Page name badge */}
              <div className="absolute bottom-3 left-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
                <h3 className="text-sm font-bold text-foreground text-center truncate">{page.name}</h3>
              </div>
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            🎨 Tap any image to start coloring • Download your artwork when done!
          </p>
        </div>
      </div>
    </div>
  )
}

