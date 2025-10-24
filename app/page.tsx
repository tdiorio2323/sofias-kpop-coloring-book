"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CharacterSelect, type Character } from "@/components/character-select"
import { ColoringCarousel } from "@/components/coloring-carousel"
import { ColoringCanvas } from "@/components/coloring-canvas"
import { Sparkles } from "lucide-react"

const characters: Character[] = [
  {
    id: "rumi",
    name: "Rumi Kang",
    role: "Leader & Main Vocalist",
    description: "Half-human, half-demon powerhouse",
    color: "#FF1493",
    avatar: "/images/characters/rumi.jpg",
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
    avatar: "/images/characters/zoey.jpg",
  },
  {
    id: "celine",
    name: "Celine",
    role: "Mentor",
    description: "Former demon-hunter, Rumi's adoptive mother",
    color: "#9370DB",
    avatar: "/images/characters/celine.jpg",
  },
  {
    id: "jinu",
    name: "Jinu",
    role: "Rival Leader",
    description: "Leader of Saja Boys",
    color: "#1E90FF",
    avatar: "/images/characters/jinu.jpg",
  },
  {
    id: "gwi-ma",
    name: "Gwi-Ma",
    role: "Main Antagonist",
    description: "Powerful demon threat",
    color: "#DC143C",
    avatar: "/images/characters/gwi-ma.jpg",
  },
  {
    id: "hana",
    name: "Hana",
    role: "Tech Specialist",
    description: "Strategist and tech genius",
    color: "#00CED1",
    avatar: "/images/characters/hana.jpg",
  },
  {
    id: "bear",
    name: "Bear",
    role: "Companion",
    description: "Rumi's demon-detection cat",
    color: "#FFA500",
    avatar: "/images/characters/bear.jpg",
  },
]

const coloringPagesByCharacter: Record<string, Array<{ id: number; src: string; name: string }>> = {
  rumi: [
    { id: 1, src: "/images/coloring-pages/singers-stage.jpg", name: "Singing Squad" },
    { id: 5, src: "/images/coloring-pages/concert-crowd.jpg", name: "Concert Time" },
  ],
  mira: [
    { id: 6, src: "/images/coloring-pages/mira-2.png", name: "Mira's Smoothie" },
    { id: 7, src: "/images/coloring-pages/mira-3.png", name: "Mira with Teddy" },
    { id: 8, src: "/images/coloring-pages/mira-4.png", name: "Mira Style" },
    { id: 9, src: "/images/coloring-pages/mira-5.png", name: "Casual Mira" },
    { id: 10, src: "/images/coloring-pages/mira-6.png", name: "Coffee Break" },
    { id: 11, src: "/images/coloring-pages/mira-7.png", name: "Military Mira" },
    { id: 12, src: "/images/coloring-pages/mira-8.png", name: "Mira Glam" },
    { id: 13, src: "/images/coloring-pages/mira-9.png", name: "Mira Selfie" },
    { id: 14, src: "/images/coloring-pages/mira-10.png", name: "Fierce Mira" },
    { id: 15, src: "/images/coloring-pages/mira-14.png", name: "Mira Ready" },
    { id: 16, src: "/images/coloring-pages/mira.png", name: "Mira on Stage" },
    { id: 17, src: "/images/coloring-pages/mira-teddy-bear-sweeter.png", name: "Teddy Bear Sweater" },
  ],
  zoey: [{ id: 4, src: "/images/coloring-pages/squad-sitting.jpg", name: "Squad Goals" }],
  celine: [{ id: 3, src: "/images/coloring-pages/laptop-friends.jpg", name: "Laptop Friends" }],
  jinu: [],
  "gwi-ma": [],
  hana: [],
  bear: [{ id: 2, src: "/images/coloring-pages/tiger-beam.jpg", name: "Tiger Power" }],
}

export default function Home() {
  const router = useRouter()
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [selectedPage, setSelectedPage] = useState<(typeof coloringPagesByCharacter)[string][0] | null>(null)

  if (!selectedCharacter) {
    return (
      <div className="cosmic-background min-h-screen relative">
        <div className="relative z-10">
          <CharacterSelect 
            characters={characters} 
            onSelectCharacter={setSelectedCharacter}
            onEnterSofiasRealm={() => router.push("/sofia/coloring")}
          />
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
    <div className="cosmic-background min-h-screen">
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
