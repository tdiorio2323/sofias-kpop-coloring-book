"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { soundEffects } from "@/lib/sound-effects"
import type { Character } from "@/components/character-select"

interface ColoringPage {
  id: number
  src: string
  name: string
}

interface ColoringCarouselProps {
  pages: ColoringPage[]
  character: Character
  onSelectPage: (page: ColoringPage) => void
  onBackToCharacters: () => void
}

export function ColoringCarousel({ pages, character, onSelectPage, onBackToCharacters }: ColoringCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  // Generate sparkle positions client-side only to avoid SSR hydration mismatch
  const [sparkles, setSparkles] = useState<Array<{ left: number; top: number; delay: number }>>([])

  useEffect(() => {
    // Generate random positions after component mounts (client-side only)
    setSparkles(
      Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
      })),
    )
  }, []) // Empty dependency array = runs once after mount

  if (pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-4xl font-bold text-foreground mb-4">Coming Soon!</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {character.name}'s coloring pages are being prepared. Check back soon!
          </p>
          <button
            onClick={() => {
              onBackToCharacters()
              soundEffects.playWhoosh()
            }}
            className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-4 rounded-full text-xl font-bold transition-all hover:scale-110 active:scale-95"
          >
            Choose Another Character
          </button>
        </div>
      </div>
    )
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? pages.length - 1 : prev - 1))
    soundEffects.playWhoosh()
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === pages.length - 1 ? 0 : prev + 1))
    soundEffects.playWhoosh()
  }

  const currentPage = pages[currentIndex]

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background sparkles - client-side rendered only */}
      <div className="absolute inset-0 pointer-events-none">
        {sparkles.map((sparkle, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary rounded-full glitter-effect"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}s`,
            }}
          />
        ))}
      </div>

      <button
        onClick={() => {
          onBackToCharacters()
          soundEffects.playWhoosh()
        }}
        className="absolute top-4 left-4 z-20 bg-card/80 backdrop-blur-sm hover:bg-card border-2 border-border hover:border-primary px-6 py-3 rounded-full flex items-center gap-2 transition-all hover:scale-110 active:scale-95"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-bold">Characters</span>
      </button>

      <div className="absolute top-4 right-4 z-20 bg-card/80 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-primary">
        <span className="font-bold" style={{ color: character.color }}>
          {character.name}
        </span>
      </div>

      {/* Main carousel */}
      <div className="relative w-full max-w-4xl z-10">
        {/* Page counter */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-primary">
            <div className="flex gap-1">
              {pages.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex ? "bg-primary w-6" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Image display */}
        <div className="relative aspect-[3/4] bg-card rounded-3xl overflow-hidden border-4 border-primary shadow-2xl shadow-primary/50">
          <button
            onClick={() => {
              onSelectPage(currentPage)
              soundEffects.playLetsGo()
            }}
            className="w-full h-full relative group"
            aria-label={`Color ${currentPage.name}`}
          >
            <Image
              src={currentPage.src || "/placeholder.svg"}
              alt={currentPage.name}
              fill
              className="object-contain p-4 transition-transform group-hover:scale-105"
              priority
            />
            {/* Tap to color overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-12">
              <div className="bg-primary text-primary-foreground px-8 py-4 rounded-full text-2xl font-bold animate-bounce">
                Tap to Color!
              </div>
            </div>
          </button>
        </div>

        {/* Navigation arrows */}
        {pages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-16 h-16 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-8 h-8 text-primary-foreground" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-16 h-16 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
              aria-label="Next page"
            >
              <ChevronRight className="w-8 h-8 text-primary-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Page name */}
      <div className="mt-8 text-center">
        <h2 className="text-4xl font-bold text-foreground drop-shadow-lg">{currentPage.name}</h2>
      </div>
    </div>
  )
}
