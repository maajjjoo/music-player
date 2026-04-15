/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioPlayer } from '../useAudioPlayer'

// Mock Audio constructor
const mockAudio = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  src: '',
  currentTime: 0,
  duration: 100,
  volume: 0.7,
  paused: true,
  readyState: 4,
}

// Create a proper constructor function
function MockAudio() {
  return mockAudio
}

;(global as any).Audio = MockAudio as any

describe('useAudioPlayer', () => {
  let onEndedMock: () => void

  beforeEach(() => {
    onEndedMock = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAudioPlayer())

    expect(result.current.isPlaying).toBe(false)
    expect(result.current.position).toBe(0)
    expect(result.current.duration).toBe(0)
    expect(result.current.volume).toBe(0.7)
  })

  it('should set up audio event listeners', () => {
    renderHook(() => useAudioPlayer(onEndedMock))

    expect(mockAudio.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function))
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('durationchange', expect.any(Function))
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('play', expect.any(Function))
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('pause', expect.any(Function))
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function))
  })

  it('should play audio with new URL', async () => {
    const { result } = renderHook(() => useAudioPlayer())

    await act(async () => {
      result.current.play('https://example.com/song.mp3')
    })

    expect(mockAudio.pause).toHaveBeenCalled()
    expect(mockAudio.src).toBe('https://example.com/song.mp3')
    expect(mockAudio.play).toHaveBeenCalled()
  })

  it('should replay current song', async () => {
    const { result } = renderHook(() => useAudioPlayer())

    await act(async () => {
      result.current.replay()
    })

    expect(mockAudio.currentTime).toBe(0)
    expect(mockAudio.play).toHaveBeenCalled()
  })

  it('should toggle play/pause', async () => {
    const { result } = renderHook(() => useAudioPlayer())

    // Test play when paused
    mockAudio.paused = true
    await act(async () => {
      result.current.togglePlay()
    })
    expect(mockAudio.play).toHaveBeenCalled()

    // Test pause when playing
    mockAudio.paused = false
    await act(async () => {
      result.current.togglePlay()
    })
    expect(mockAudio.pause).toHaveBeenCalled()
  })

  it('should seek to position', () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => {
      result.current.seek(5000) // 5 seconds
    })

    expect(mockAudio.currentTime).toBe(5)
  })

  it('should set volume', () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => {
      result.current.setVolume(0.5)
    })

    expect(mockAudio.volume).toBe(0.5)
    expect(result.current.volume).toBe(0.5)
  })

  it('should call onEnded when audio ends', () => {
    renderHook(() => useAudioPlayer(onEndedMock))

    // Simulate ended event
    const endedHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'ended'
    )?.[1]

    act(() => {
      endedHandler?.()
    })

    expect(onEndedMock).toHaveBeenCalled()
  })

  it('should update state on timeupdate', () => {
    const { result } = renderHook(() => useAudioPlayer())

    // Simulate timeupdate event
    mockAudio.currentTime = 10
    const timeUpdateHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'timeupdate'
    )?.[1]

    act(() => {
      timeUpdateHandler?.()
    })

    expect(result.current.position).toBe(10000) // 10 seconds in ms
  })

  it('should update duration on durationchange', () => {
    const { result } = renderHook(() => useAudioPlayer())

    // Simulate durationchange event
    mockAudio.duration = 180
    const durationChangeHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'durationchange'
    )?.[1]

    act(() => {
      durationChangeHandler?.()
    })

    expect(result.current.duration).toBe(180000) // 180 seconds in ms
  })

  it('should handle play errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockAudio.play.mockRejectedValueOnce(new Error('Play failed'))

    const { result } = renderHook(() => useAudioPlayer())

    await act(async () => {
      result.current.play('https://example.com/song.mp3')
    })

    expect(consoleSpy).toHaveBeenCalledWith('Playback error:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('should ignore AbortError', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const abortError = new Error('Abort')
    abortError.name = 'AbortError'
    mockAudio.play.mockRejectedValueOnce(abortError)

    const { result } = renderHook(() => useAudioPlayer())

    await act(async () => {
      result.current.play('https://example.com/song.mp3')
    })

    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})