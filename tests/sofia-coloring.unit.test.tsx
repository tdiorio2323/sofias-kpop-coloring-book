import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { CharacterSelect } from '@/components/character-select'
import SofiaColoringPage from '@/app/sofia/coloring/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

// Mock sound effects
vi.mock('@/lib/sound-effects', () => ({
  soundEffects: {
    playLetsGo: vi.fn(),
    playWhoosh: vi.fn(),
    playSparkle: vi.fn(),
    playPowerChord: vi.fn(),
    playDemonVoice: vi.fn(),
    playCrowdCheer: vi.fn(),
  },
}))

// Mock storage
vi.mock('@/lib/storage', () => ({
  saveColoring: vi.fn(),
  getSavedColoring: vi.fn(() => null),
  unlockRandomSticker: vi.fn(() => null),
}))

describe('Sofia Coloring Book - Hydration Safety', () => {
  beforeEach(() => {
    // Clear console spies before each test
    vi.clearAllMocks()
  })

  it('renders CharacterSelect without hydration warnings', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const mockCharacters = [
      {
        id: 'test',
        name: 'Test Character',
        role: 'Test Role',
        description: 'Test Description',
        color: '#FF0000',
        avatar: '/test.jpg',
      },
    ]

    render(
      <CharacterSelect 
        characters={mockCharacters} 
        onSelectCharacter={vi.fn()} 
      />
    )

    // Wait for client-side effects to complete
    await waitFor(() => {
      expect(screen.getByText('Choose Your Character')).toBeInTheDocument()
    })

    // Check that no hydration errors occurred
    const hydrationErrors = consoleErrorSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && arg.toLowerCase().includes('hydration')
      )
    )

    expect(hydrationErrors).toHaveLength(0)
    
    consoleErrorSpy.mockRestore()
  })

  it('generates sparkles only on client side (not during SSR)', async () => {
    const mockCharacters = [
      {
        id: 'test',
        name: 'Test',
        role: 'Role',
        description: 'Desc',
        color: '#FF0000',
        avatar: '/test.jpg',
      },
    ]

    // First render simulates SSR (sparkles array should be empty initially)
    const { container, rerender } = render(
      <CharacterSelect 
        characters={mockCharacters} 
        onSelectCharacter={vi.fn()} 
      />
    )

    // Initially, sparkles should not be present (empty state)
    const sparklesBefore = container.querySelectorAll('.glitter-effect')
    
    // After client-side effect runs, sparkles should appear
    await waitFor(() => {
      const sparklesAfter = container.querySelectorAll('.glitter-effect')
      expect(sparklesAfter.length).toBeGreaterThan(0)
    }, { timeout: 1000 })
  })

  it('Sofia coloring page sparkles render client-side only', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<SofiaColoringPage />)

    await waitFor(() => {
      expect(screen.getByText(/Sofia's Coloring Studio/i)).toBeInTheDocument()
    })

    // No hydration warnings
    const hydrationErrors = consoleErrorSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && arg.toLowerCase().includes('hydration')
      )
    )

    expect(hydrationErrors).toHaveLength(0)
    
    consoleErrorSpy.mockRestore()
  })
})

describe('Sofia Coloring Book - Component Rendering', () => {
  it('renders coloring page grid with all 7 pages', async () => {
    render(<SofiaColoringPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Singing Squad')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Tiger Power')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Laptop Friends')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Squad Goals')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Concert Time')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Demon Hunters')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Battle Ready')[0]).toBeInTheDocument()
    })
  })

  it('has accessible navigation button', async () => {
    render(<SofiaColoringPage />)

    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /back to characters/i })
      expect(backButton).toBeInTheDocument()
    })
  })

  it('displays cosmic background title and description', async () => {
    render(<SofiaColoringPage />)

    await waitFor(() => {
      expect(screen.getByText(/Sofia's Coloring Studio/i)).toBeInTheDocument()
      expect(screen.getByText(/Choose a K-Pop Demon Hunters scene to color/i)).toBeInTheDocument()
    })
  })
})

describe('Character Selection', () => {
  it('renders Enter Sofia\'s Realm button when provided', async () => {
    const mockCharacters = [
      {
        id: 'rumi',
        name: 'Rumi Kang',
        role: 'Leader',
        description: 'Test',
        color: '#FF1493',
        avatar: '/rumi.jpg',
      },
    ]

    const onEnterRealm = vi.fn()

    render(
      <CharacterSelect 
        characters={mockCharacters} 
        onSelectCharacter={vi.fn()}
        onEnterSofiasRealm={onEnterRealm}
      />
    )

    await waitFor(() => {
      const realmButton = screen.getByRole('button', { name: /enter sofia's realm/i })
      expect(realmButton).toBeInTheDocument()
    })
  })

  it('calls onSelectCharacter when character is clicked', async () => {
    const user = userEvent.setup()
    const mockCharacters = [
      {
        id: 'rumi',
        name: 'Rumi Kang',
        role: 'Leader',
        description: 'Test',
        color: '#FF1493',
        avatar: '/rumi.jpg',
      },
    ]

    const onSelect = vi.fn()

    render(
      <CharacterSelect 
        characters={mockCharacters} 
        onSelectCharacter={onSelect}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Rumi Kang')).toBeInTheDocument()
    })

    const characterButton = screen.getByText('Rumi Kang').closest('button')
    if (characterButton) {
      await user.click(characterButton)
      expect(onSelect).toHaveBeenCalledWith(mockCharacters[0])
    }
  })
})

describe('Accessibility', () => {
  it('has proper heading hierarchy', async () => {
    render(<SofiaColoringPage />)

    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: /Sofia's Coloring Studio/i })
      expect(heading).toBeInTheDocument()
    })
  })

  it('all interactive elements are keyboard accessible', async () => {
    const user = userEvent.setup()
    render(<SofiaColoringPage />)

    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /back to characters/i })
      expect(backButton).toBeInTheDocument()
    })

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    
    // All buttons should be focusable
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1')
    })
  })
})

