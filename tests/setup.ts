import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock HTMLCanvasElement methods for canvas testing
HTMLCanvasElement.prototype.getContext = function() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillRect: () => {},
    drawImage: () => {},
    getImageData: () => ({
      data: new Uint8ClampedArray(0),
      width: 0,
      height: 0,
    }),
    putImageData: () => {},
    createImageData: () => ({
      data: new Uint8ClampedArray(0),
      width: 0,
      height: 0,
    }),
    clearRect: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
  } as any
}

HTMLCanvasElement.prototype.toDataURL = function() {
  return 'data:image/png;base64,mock'
}


