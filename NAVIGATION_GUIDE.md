# Sofia's K-Pop Coloring Book - Navigation Guide

## 🎨 App Structure & Flow

```
┌─────────────────────────────────────────────────────┐
│                   HOMEPAGE (/)                      │
│                                                     │
│  ╔════════════════════════════════════════╗        │
│  ║  🌟 Enter Sofia's Realm 🌟             ║ ←──┐  │
│  ╚════════════════════════════════════════╝    │  │
│                                                │  │
│         Choose Your Character                  │  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │  │
│  │Rumi │ │Mira │ │Zoey │ │Cel. │             │  │
│  └─────┘ └─────┘ └─────┘ └─────┘             │  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │  │
│  │Jinu │ │Gwi- │ │Hana │ │Bear │             │  │
│  └─────┘ │ Ma  │ └─────┘ └─────┘             │  │
│          └─────┘                              │  │
│                                                │  │
│  🌌 Cosmic Background with Twinkling Stars    │  │
└────────────────┬────────────────────────────────┘  │
                 │                                    │
                 │ Select Character                   │
                 ↓                                    │
┌─────────────────────────────────────────────────┐  │
│           CHARACTER PAGES VIEW                  │  │
│                                                 │  │
│  ← Back to Characters                          │  │
│                                                 │  │
│  📖 Character's Coloring Pages Carousel        │  │
│                                                 │  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │  │
│  │  Page 1 │  │  Page 2 │  │  Page 3 │        │  │
│  │   ▶️    │  │   ▶️    │  │   ▶️    │        │  │
│  └─────────┘  └─────────┘  └─────────┘        │  │
│                                                 │  │
│  🌌 Cosmic Background                          │  │
└────────────────┬────────────────────────────────┘  │
                 │                                    │
                 │ Select Page                        │
                 ↓                                    │
┌─────────────────────────────────────────────────┐  │
│              COLORING CANVAS                    │  │
│                                                 │  │
│  🏠 ← Home         📥 💾 ↶ 🗑️                  │  │
│                                                 │  │
│  ╔═══════════════════════════════════════════╗ │  │
│  ║                                           ║ │  │
│  ║         🎨 COLORING AREA 🎨              ║ │  │
│  ║                                           ║ │  │
│  ║         [Your Artwork Here]              ║ │  │
│  ║                                           ║ │  │
│  ║              80% Complete                ║ │  │
│  ╚═══════════════════════════════════════════╝ │  │
│                                                 │  │
│  [Crayon] [✨Glitter] [Laser] [-Size: 20+]    │  │
│                                                 │  │
│  🔴 🟢 🟣 ⚪ 🟡 🔴 🟠 ⚪                       │  │
│                                                 │  │
│  ⬛ Black Background (for focus)              │  │
└─────────────────────────────────────────────────┘  │
                                                      │
                 ↑────────────────────────────────────┘
                 │
                 │ Click "Enter Sofia's Realm"
                 │
┌─────────────────────────────────────────────────┐
│          SOFIA'S COLORING STUDIO                │
│         (/sofia/coloring)                       │
│                                                 │
│  ← Back to Characters                          │
│                                                 │
│      🌟 Sofia's Coloring Studio 🌟            │
│   Choose a K-Pop Demon Hunters scene!          │
│                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │Singing │ │Tiger   │ │Laptop  │ │Squad   │  │
│  │Squad   │ │Power   │ │Friends │ │Goals   │  │
│  │   🎨   │ │   🎨   │ │   🎨   │ │   🎨   │  │
│  └────────┘ └────────┘ └────────┘ └────────┘  │
│  ┌────────┐ ┌────────┐ ┌────────┐             │
│  │Concert │ │Demon   │ │Battle  │             │
│  │Time    │ │Hunters │ │Ready   │             │
│  │   🎨   │ │   🎨   │ │   🎨   │             │
│  └────────┘ └────────┘ └────────┘             │
│                                                 │
│  🌌 Cosmic Background with 50+ Sparkles        │
└────────────────┬────────────────────────────────┘
                 │
                 │ Select Page
                 ↓
          (Opens Coloring Canvas)
```

## 🎮 Interactive Controls

### Coloring Canvas Controls:
- **🏠 Home Button**: Return to previous screen
- **📥 Download Button**: Save artwork as PNG
- **💾 Sticker Book**: View unlocked stickers
- **↶ Undo Button**: Revert last action (up to 10 steps)
- **🗑️ Clear Button**: Erase all (with confirmation)
- **- / +**: Decrease/Increase brush size (5-50)

### Brush Types:
1. **Crayon** 🖍️ - Standard drawing (uses full brush size)
2. **Glitter** ✨ - Sparkly effect with particles
3. **Laser** ⚡ - Thin, precise lines (half brush size)

### Color Palette:
- 🔴 **Magenta** (with glitter)
- 🟢 **Lime**
- 🟣 **Violet**
- ⚪ **Silver** (with glitter)
- 🟡 **Gold** (with glitter)
- 🔴 **Red**
- 🟠 **Peach**
- ⚪ **White**

## 🌟 Key Features

### Cosmic/Galactic Background Layers:
1. **Base Gradient** (cosmic-background)
   - Peachy coral → Hot pink → Lavender → Purple-blue → Cyan
   - Animates smoothly every 20 seconds

2. **Stars Layer** (::before pseudo-element)
   - 9 radial gradient stars
   - Twinkling animation every 3 seconds
   - Various sizes (1px-2px)

3. **Nebula Layer** (::after pseudo-element)
   - Floating clouds with K-pop colors
   - Magenta, cyan, lavender gradients
   - Gentle vertical float animation

### Responsive Breakpoints:
- **Mobile (< 640px)**: 1 column layout
- **Small Tablet (640px+)**: 2 columns
- **Large Tablet (1024px+)**: 3 columns
- **Desktop (1280px+)**: 4 columns

### Sound Effects:
- 🎵 "Let's Go" - Color selection, download
- 🎵 "Whoosh" - Character hover, undo, brush size
- 🎵 "Sparkle" - Glitter brush
- 🎵 "Power Chord" - Laser brush
- 🎵 "Demon Voice" - Clear canvas
- 🎵 "Crowd Cheer" - Complete artwork (80%+)

## 📱 Touch & Mouse Support

- ✅ Pointer events for unified touch/mouse handling
- ✅ Touch-friendly 56px minimum button size
- ✅ Smooth drawing on all devices
- ✅ No accidental scrolling while drawing

## 🎯 Quick Start

1. **Visit homepage**: See cosmic background with characters
2. **Click "Enter Sofia's Realm"**: Access all 7 coloring pages
3. **Select any scene**: Opens full-featured canvas
4. **Start coloring**: 
   - Pick a color
   - Choose brush type
   - Adjust size
   - Draw!
5. **Download when done**: Click download button
6. **Navigate back**: Use back buttons to explore more

---

**Pro Tip**: Unlock special stickers by completing pages to 80%! 🎁✨

