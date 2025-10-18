"use client"

import { useState } from "react"
import { CharacterSelect, type Character } from "@/components/character-select"
import { ColoringCarousel } from "@/components/coloring-carousel"
import { ColoringCanvas } from "@/components/coloring-canvas"

const characters: Character[] = [
  {
    id: "rumi",
    name: "Rumi Kang",
    role: "Leader & Main Vocalist",
    description: "Half-human, half-demon powerhouse",
    color: "#FF1493",
    avatar: "/images/characters/rumi.png",
  },
  {
    id: "mira",
    name: "Mira",
    role: "Main Dancer",
    description: "Disciplined and fierce",
    color: "#00FF00",
    avatar: "/images/characters/mira.jpg",
  },
  {
    id: "zoey",
    name: "Zoey",
    role: "Rapper & Youngest",
    description: "Fresh energy and fire",
    color: "#FFD700",
    avatar: "/images/characters/zoey.webp",
  },
  {
    id: "celine",
    name: "Celine",
    role: "Mentor",
    description: "Former demon-hunter, Rumi's adoptive mother",
    color: "#9370DB",
    avatar: "/images/characters/celine.webp",
  },
  {
    id: "jinu",
    name: "Jinu",
    role: "Rival Leader",
    description: "Leader of Saja Boys",
    color: "#1E90FF",
    avatar: "/images/characters/jinu.jpeg",
  },
  {
    id: "derpy",
    name: "Derpy",
    role: "Mischievous Antagonist",
    description: "Playful yet menacing blue cat demon",
    color: "#00CED1",
    avatar: "/images/characters/derpy.png",
  },
  {
    id: "baby-saja",
    name: "Baby Saja",
    role: "Adorable Sidekick",
    description: "Cute and curious little helper",
    color: "#FFB6C1",
    avatar: "/images/characters/baby-saja.avif",
  },
  {
    id: "sussie",
    name: "Sussie",
    role: "Mysterious Companion",
    description: "Enigmatic bird with demon-sensing abilities",
    color: "#4B0082",
    avatar: "/images/characters/sussie.png",
  },
]

const coloringPagesByCharacter: Record<string, Array<{ id: number; src: string; name: string }>> = {
  rumi: [
    { id: 1, src: "/images/coloring-pages/singers-stage.jpg", name: "Singing Squad" },
    { id: 5, src: "/images/coloring-pages/concert-crowd.jpg", name: "Concert Time" },
  ],
  mira: [
    { id: 6, src: "/images/coloring-pages/demon-hunters-action.jpg", name: "Demon Hunters" },
    { id: 7, src: "/images/coloring-pages/demon-hunters-weapons.jpg", name: "Battle Ready" },
  ],
  zoey: [{ id: 4, src: "/images/coloring-pages/squad-sitting.jpg", name: "Squad Goals" }],
  celine: [{ id: 3, src: "/images/coloring-pages/laptop-friends.jpg", name: "Laptop Friends" }],
  jinu: [],
  derpy: [],
  "baby-saja": [],
  sussie: [{ id: 2, src: "/images/coloring-pages/tiger-beam.jpg", name: "Tiger Power" }],
}

export default function Home() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [selectedPage, setSelectedPage] = useState<(typeof coloringPagesByCharacter)[string][0] | null>(null)

  if (!selectedCharacter) {
    return (
      <div className="concert-background min-h-screen">
        <div className="relative z-10">
          <CharacterSelect characters={characters} onSelectCharacter={setSelectedCharacter} />
        </div>
      </div>
    )
  }

  const characterPages = coloringPagesByCharacter[selectedCharacter.id] || []

  if (selectedPage) {
    return (
      <ColoringCanvas
        page={selectedPage}
        onBack={() => setSelectedPage(null)}
        characterColor={selectedCharacter.color}
      />
    )
  }

  return (
    <div className="concert-background min-h-screen">
      <div className="relative z-10">
        <ColoringCarousel
          pages={characterPages}
          character={selectedCharacter}
          onSelectPage={setSelectedPage}
          onBackToCharacters={() => setSelectedCharacter(null)}
        />
      </div>
    </div>
  )
}
