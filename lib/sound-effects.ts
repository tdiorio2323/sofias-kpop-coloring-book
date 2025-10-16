// Sound effect utilities using Web Audio API
class SoundEffects {
  private audioContext: AudioContext | null = null

  private getAudioContext() {
    if (typeof window === 'undefined') return null
    
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  // Play a "whoosh" sound for undo
  playWhoosh() {
    const ctx = this.getAudioContext()
    if (!ctx) return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(800, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3)

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  }

  // Play a demon voice effect for clear confirmation
  playDemonVoice() {
    const ctx = this.getAudioContext()
    if (!ctx) return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = "sawtooth"
    oscillator.frequency.setValueAtTime(100, ctx.currentTime)
    oscillator.frequency.setValueAtTime(120, ctx.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(90, ctx.currentTime + 0.2)

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.3)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  }

  // Play sparkle sound for glitter brush
  playSparkle() {
    const ctx = this.getAudioContext()
    if (!ctx) return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(2000, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }

  // Play power chord for weapon coloring
  playPowerChord() {
    const ctx = this.getAudioContext()
    if (!ctx) return

    // Create multiple oscillators for a chord
    const frequencies = [220, 277, 330] // A major chord
    const oscillators = frequencies.map((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = "square"
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

      return { osc, gain }
    })

    oscillators.forEach(({ osc }) => {
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    })
  }

  // Play crowd cheer for completion
  playCrowdCheer() {
    const ctx = this.getAudioContext()
    if (!ctx) return

    // Create noise for crowd effect
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gainNode = ctx.createGain()

    noise.buffer = buffer
    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    filter.type = "bandpass"
    filter.frequency.setValueAtTime(1000, ctx.currentTime)

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2)

    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + 2)
  }

  // Play "Let's go!" chant effect
  playLetsGo() {
    const ctx = this.getAudioContext()
    if (!ctx) return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = "triangle"
    oscillator.frequency.setValueAtTime(400, ctx.currentTime)
    oscillator.frequency.setValueAtTime(500, ctx.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.3)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  }
}

export const soundEffects = new SoundEffects()
