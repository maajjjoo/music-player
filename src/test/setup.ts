/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'

// Mock HTML5 Audio
(global as any).HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve())
;(global as any).HTMLMediaElement.prototype.pause = vi.fn()
;(global as any).HTMLMediaElement.prototype.load = vi.fn()

// Mock requestAnimationFrame
;(global as any).requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  setTimeout(cb, 16)
  return 1
})

;(global as any).cancelAnimationFrame = vi.fn()

// Mock canvas for color extraction
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255])
  }))
})) as any