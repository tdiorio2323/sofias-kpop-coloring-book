# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sofia's K-Pop Demon Hunters Coloring Book** - A Next.js 15 interactive coloring studio application designed for children. Features a cosmic-themed UI with canvas-based drawing, bucket fill tool, keyboard shortcuts, gallery system, and sticker rewards.

## Development Commands

### Core Development
```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm dev

# Production build
pnpm build

# Start production server (port 3000)
pnpm start
```

### Testing
```bash
# Run all validations (typecheck + lint + test + build)
pnpm validate

# TypeScript type checking (no emit, tsc)
pnpm typecheck

# ESLint
pnpm lint

# Unit tests (Vitest)
pnpm test              # or pnpm test:unit
pnpm test:ui           # Vitest UI

# E2E tests (Playwright)
pnpm test:e2e
pnpm test:e2e:ui       # Playwright UI mode

# Mobile-specific tests
pnpm test:mobile
```

### Performance & Quality
```bash
# Lighthouse audit (requires production build + server running)
pnpm lighthouse

# Full validation pipeline (used in CI)
pnpm validate
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15.2.4 (App Router)
- **React**: 19
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **Canvas**: HTML5 Canvas API for drawing
- **State**: React hooks (useState, useEffect, useCallback)
- **Storage**: localStorage for persistence
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: Vercel

### Directory Structure
```
app/                    # Next.js app router
  ├── layout.tsx        # Root layout with ErrorBoundary, Toaster, Analytics
  ├── page.tsx          # Homepage (character selection)
  ├── globals.css       # Global styles + Tailwind
  └── sofia/coloring/   # Coloring studio page

components/
  ├── coloring-canvas.tsx      # Main canvas component (~1000 lines)
  ├── coloring-carousel.tsx    # Page selection carousel
  ├── character-select.tsx     # Character selection UI
  ├── gallery.tsx              # Art gallery with stats
  ├── sticker-book.tsx         # Sticker collection display
  ├── sticker-notification.tsx # Unlock notifications
  ├── error-boundary.tsx       # Error recovery UI
  └── ui/                      # Radix UI components (shadcn/ui)

lib/
  ├── storage.ts        # localStorage utilities (colorings, stickers)
  ├── sound-effects.ts  # Audio feedback system
  └── utils.ts          # Tailwind merge utilities

tests/
  ├── setup.ts                      # Vitest configuration
  ├── sofia-coloring.unit.test.tsx  # Unit tests (10 tests)
  └── mobile.spec.ts                # Mobile E2E tests

public/
  ├── images/           # Coloring page source images (7 pages)
  ├── manifest.json     # PWA manifest
  └── *.png/*.svg       # Icons, favicons
```

### Key Components

#### ColoringCanvas (`components/coloring-canvas.tsx`)
The heart of the application. Handles:
- Canvas drawing with multiple brush types (crayon, glitter, laser, bucket)
- Edge detection algorithm for outline mode (Sobel-like filter)
- Bucket fill using flood-fill algorithm
- History/undo system (stores last 10 ImageData states)
- Completion percentage calculation
- Auto-save to localStorage every 10 strokes
- Keyboard shortcuts (numbers for colors, B for brushes, +/- for size, Ctrl+Z/S)
- Toast notifications for user feedback
- Loading states with spinner overlay

**Important**: Edge detection is CPU-intensive. The algorithm converts images to grayscale, applies Sobel operator for edge detection, produces black lines on white background.

#### Storage System (`lib/storage.ts`)
- `SavedColoring`: pageId, dataUrl, timestamp, completionPercentage
- `Sticker`: id, name, emoji, unlockedAt
- Unlocks random stickers when artwork reaches 80% completion
- localStorage keys: `kpop-colorings`, `kpop-stickers`

#### Gallery (`components/gallery.tsx`)
- Displays all saved colorings with thumbnails
- Shows creation date, favorite status, completion percentage
- Stats dashboard: total artworks, completed count, favorites, average completion
- Actions: view, favorite, download, delete

### Build Configuration

#### TypeScript (`tsconfig.json`)
- Strict mode enabled
- Module resolution: bundler
- Path alias: `@/*` maps to `./*`
- Excludes: vitest.config.ts, playwright.config.ts (prevents vite/next conflicts)

#### Next.js (`next.config.mjs`)
- TypeScript build errors ignored (checked separately via `pnpm typecheck`)
- ESLint enabled during builds
- Image optimization: AVIF/WebP formats
- React strict mode enabled
- Compression enabled, powered-by header disabled

#### Testing Setup
- **Vitest**: happy-dom environment, globals enabled
- **Playwright**: Single worker, chromium only, auto-starts dev server on port 3000
- **Coverage**: V8 provider, text/json/html reporters

## Canvas Drawing Architecture

### Drawing Flow
1. User interaction triggers `handlePointerDown/Move/Up`
2. For bucket fill: executes flood-fill algorithm immediately
3. For brushes: draws to canvas via `draw()` callback
4. On pointer up: saves to history via `saveToHistory()`
5. Every 10 strokes: auto-saves to localStorage

### Brush Types
- **Crayon**: Standard stroke with full brush size
- **Glitter**: Creates random sparkle particles, plays sound effects
- **Laser**: Thin lines (half brush size)
- **Bucket**: Flood-fill algorithm with color matching tolerance (±10 RGB)

### Edge Detection Algorithm
Located in `loadFreshPage()` and `clearCanvas()`:
1. Draw image to temporary canvas
2. Convert to grayscale (0.299R + 0.587G + 0.114B)
3. Apply Sobel operator to detect edges (gradient calculation)
4. Threshold at magnitude > 50
5. Result: black edges (0) on white background (255)

### Performance Considerations
- Edge detection blocks UI → `setIsProcessing(true)` shows spinner
- Canvas operations use `globalCompositeOperation: "source-over"`
- History limited to last 10 states to prevent memory issues
- Completion calculation samples every 40th pixel (performance optimization)

## Testing Strategy

### Unit Tests (`tests/sofia-coloring.unit.test.tsx`)
- 10 tests covering core utilities
- Uses @testing-library/react
- Tests storage functions, color utilities, UI rendering

### E2E Tests (`tests/mobile.spec.ts`)
- Mobile viewport testing (iPhone 12)
- Accessibility checks with @axe-core/playwright
- Tests: canvas loading, touch drawing, button interactions
- Validates WCAG compliance

### CI/CD
GitHub Actions workflow (`.github/workflows/`) runs on push/PR:
1. TypeScript type checking
2. ESLint
3. Unit tests
4. Production build

## Common Development Patterns

### Adding a New Coloring Page
1. Add image to `public/images/`
2. Update page array in `app/sofia/coloring/page.tsx`
3. Ensure image is web-optimized (recommended: < 500KB)

### Modifying Brush Behavior
Edit `draw()` callback in `components/coloring-canvas.tsx`:
- Line 374-411 handles all brush types
- Each brush type has conditional logic for rendering
- Sound effects triggered in glitter brush section

### Adding Keyboard Shortcuts
Modify `handleKeyPress` in `useEffect` (lines 577-654):
- Prevent default for system shortcuts (Ctrl+Z, Ctrl+S)
- Add new key handlers following existing patterns
- Update help dialog UI (lines 947-1027) to document new shortcuts

### Working with localStorage
Use functions from `lib/storage.ts`:
- `saveColoring()`: Persist canvas state
- `getSavedColorings()`: Retrieve all saved work
- `unlockRandomSticker()`: Reward system

## Known Constraints

### Browser Compatibility
- Requires HTML5 Canvas support
- Pointer events API (modern browsers)
- localStorage available
- Sound effects may require user interaction first (autoplay policies)

### Performance
- Edge detection synchronous (blocks main thread)
- Large canvas sizes may impact mobile devices
- Flood fill can be slow on complex images (use visited Set for deduplication)

### Image Requirements
- CORS: Images must be same-origin or CORS-enabled
- Crossorigin attribute set to "anonymous" for canvas export
- Recommended size: 800x800px or smaller for performance

## Deployment

### Vercel (Current Platform)
```bash
# Project is already linked to Vercel
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Project Details:**
- Project ID: `prj_CxnoxCel3SEHHziSeQoUACQDdDN9`
- Project Name: `sofias-kpop-coloring-book`
- Organization: `td-studioss-projects`
- GitHub Repo: https://github.com/tdiorio2323/sofias-kpop-coloring-book
- Vercel Dashboard: https://vercel.com/td-studioss-projects/sofias-kpop-coloring-book
- Production URL: https://sofias-kpop-coloring-book-mrd9kif94-td-studioss-projects.vercel.app
- Custom Domain: https://sofia.tdstudiosny.com (SSL certificate being provisioned)

### Pre-Deployment Checklist
```bash
# Full validation
pnpm validate

# Check bundle size
pnpm build
# Look for "First Load JS" output (target: < 150 kB)

# Test production build locally
pnpm build && pnpm start
```

See `DEPLOYMENT_CHECKLIST.md` for comprehensive deployment guide.

## Code Quality Standards

### TypeScript
- Always use strict types
- Prefer interfaces for objects, types for unions
- Use `React.FC` sparingly (prefer explicit typing)
- Import types with `type` keyword: `import type { Foo } from ...`

### Component Patterns
- Client components: `"use client"` directive at top
- Use Radix UI primitives for interactive elements
- Toast notifications via `sonner` library
- Error boundaries wrap all routes

### Styling
- Tailwind utility classes
- CSS custom properties in globals.css for theming
- Responsive design: mobile-first approach
- Touch targets: minimum 44x44px (accessibility)

### State Management
- Local state with `useState` for component-specific data
- `useRef` for DOM references and timers
- `useCallback` for performance-critical functions (e.g., draw)
- localStorage for persistence (no external state library)

## Accessibility

### Requirements
- All interactive elements have aria-labels
- Color contrast ≥ 4.5:1 (checked in E2E tests)
- Keyboard navigation: Tab, Enter, Escape, arrow keys
- Screen reader support (semantic HTML)
- Focus indicators visible
- Touch targets ≥ 44px

### Testing Accessibility
```bash
# E2E tests include axe-core checks
pnpm test:e2e

# Manual testing
# - Tab through all controls
# - Test with screen reader (VoiceOver on Mac)
# - Zoom to 200% - verify usability
```

## Troubleshooting

### Canvas Not Drawing
- Check `canvasRef.current` is not null
- Verify canvas dimensions set correctly
- Ensure pointer events attached
- Check browser console for errors

### Images Not Loading
- Verify image path in public/images/
- Check CORS headers if external images
- Inspect Network tab for 404s
- Ensure Next.js static file serving works

### Edge Detection Slow/Broken
- Algorithm runs synchronously (expected)
- Loading spinner should appear (`isProcessing` state)
- For large images, consider optimizing source
- Check browser supports canvas operations

### Tests Failing
```bash
# Clear cache and reinstall
rm -rf .next node_modules pnpm-lock.yaml
pnpm install

# Run tests individually
pnpm test:unit
pnpm test:e2e

# Check Node version (requires 20.x)
node --version
```

## Performance Optimization Tips

### Bundle Size
- Current First Load JS: ~122 kB (good)
- Avoid adding heavy dependencies
- Use dynamic imports for large components
- Tree-shake unused Radix UI components

### Runtime Performance
- Completion calculation samples pixels (every 40th)
- History limited to 10 states
- Debounce/throttle expensive operations
- Use `useCallback` for event handlers

### Image Optimization
- Next.js automatic image optimization enabled
- Use AVIF/WebP formats (configured in next.config.mjs)
- Compress source images before adding to public/
- Lazy load off-screen images

## Future Enhancement Ideas

See `IMPROVEMENT_ROADMAP.md` for detailed feature roadmap including:
- Undo/redo with full history
- More brush types (watercolor, marker)
- Collaborative features
- Print-ready export
- Animation/GIF export
- Social sharing
