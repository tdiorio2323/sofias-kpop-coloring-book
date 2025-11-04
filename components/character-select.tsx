"use client"

import { useState, useEffect } from "react"
import { soundEffects } from "@/lib/sound-effects"

export interface Character {
  id: string
  name: string
  role: string
  description: string
  color: string
  avatar: string
}

interface CharacterSelectProps {
  characters: Character[]
  onSelectCharacter: (character: Character) => void
}

export function CharacterSelect({ characters, onSelectCharacter }: CharacterSelectProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  // Generate sparkle positions client-side only to avoid SSR hydration mismatch
  const [sparkles, setSparkles] = useState<Array<{ left: number; top: number; delay: number }>>([])

  useEffect(() => {
    // Generate random positions after component mounts (client-side only)
    setSparkles(
      Array.from({ length: 30 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
      })),
    )
  }, []) // Empty dependency array = runs once after mount

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Concert stage background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/images/concert-stage-background.jpg)",
        }}
      />

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Animated background sparkles - client-side rendered only */}
      <div className="absolute inset-0 pointer-events-none">
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

      {/* Title */}
      <div className="text-center mb-12 z-10">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          Choose Your Character
        </h1>
        <p className="text-xl md:text-2xl text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          Pick a HUNTR/X member to start coloring!
        </p>
      </div>

      {/* Character grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl z-10">
        {characters.map((character) => (
          <button
            key={character.id}
            onClick={() => {
              onSelectCharacter(character)
              soundEffects.playLetsGo()
            }}
            onMouseEnter={() => {
              setHoveredId(character.id)
              soundEffects.playWhoosh()
            }}
            onMouseLeave={() => setHoveredId(null)}
            className="group relative"
          >
            {/* Character card */}
            <div
              className={`relative aspect-[3/4] rounded-3xl overflow-hidden border-4 transition-all duration-300 ${
                hoveredId === character.id
                  ? "border-primary scale-110 shadow-2xl shadow-primary/50"
                  : "border-border hover:border-primary/50"
              }`}
              style={{
                backgroundColor: hoveredId === character.id ? character.color + "20" : undefined,
              }}
            >
              {/* Avatar placeholder */}
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                {character.avatar ? (
                  <img
                    src={character.avatar || "/placeholder.svg"}
                    alt={character.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to letter if image fails to load
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : (
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center text-6xl font-bold"
                    style={{ backgroundColor: character.color + "40", color: character.color }}
                  >
                    {character.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Hover overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent transition-opacity ${
                  hoveredId === character.id ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">{character.role}</p>
                  <p className="text-xs text-muted-foreground/80">{character.description}</p>
                </div>
              </div>
            </div>

            {/* Character name */}
            <div className="mt-3 text-center">
              <h3
                className="text-xl font-bold transition-colors"
                style={{ color: hoveredId === character.id ? character.color : undefined }}
              >
                {character.name}
              </h3>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
