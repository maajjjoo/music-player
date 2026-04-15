import { useEffect, useRef, useState } from 'react';
import type { SongNode } from '../../models/Song';
import type { RepeatMode } from '../../hooks/usePlaylist';
import './Vinyl.css';

interface VinylProps {
  currentSong: SongNode | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (position: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onColorExtracted: (color: string) => void;
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function extractDominantColor(imgEl: HTMLImageElement): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#c9b8f5';
    ctx.drawImage(imgEl, 0, 0, 10, 10);
    const data = ctx.getImageData(0, 0, 10, 10).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    const count = data.length / 4;
    // Pastelify: mix with white
    const pr = Math.floor((r / count + 255) / 2);
    const pg = Math.floor((g / count + 255) / 2);
    const pb = Math.floor((b / count + 255) / 2);
    return `rgb(${pr},${pg},${pb})`;
  } catch {
    return '#c9b8f5';
  }
}

export function Vinyl({
  currentSong,
  isPlaying,
  position,
  duration,
  volume,
  repeatMode,
  isShuffled,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleRepeat,
  onToggleShuffle,
  onColorExtracted,
}: VinylProps) {
  const song = currentSong?.song;
  const imgRef = useRef<HTMLImageElement>(null);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Spin animation
  useEffect(() => {
    if (isPlaying) {
      const animate = (time: number) => {
        if (lastTimeRef.current) {
          const delta = time - lastTimeRef.current;
          rotationRef.current = (rotationRef.current + delta * 0.03) % 360;
          setRotation(rotationRef.current);
        }
        lastTimeRef.current = time;
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = 0;
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying]);

  // Extract color from album art
  function handleImgLoad() {
    if (imgRef.current) {
      const color = extractDominantColor(imgRef.current);
      onColorExtracted(color);
    }
  }

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className="vinyl-panel">
      {/* Turntable base */}
      <div className="turntable">
        {/* Tonearm */}
        <div className={`tonearm ${isPlaying ? 'tonearm--playing' : ''}`}>
          <div className="tonearm__arm" />
          <div className="tonearm__head" />
        </div>

        {/* Vinyl disc */}
        <div
          className="vinyl-disc"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Grooves */}
          <div className="vinyl-disc__grooves" />

          {/* Center label with album art */}
          <div className="vinyl-disc__label">
            {song?.albumArt ? (
              <img
                ref={imgRef}
                src={song.albumArt}
                alt={song.album}
                className="vinyl-disc__art"
                onLoad={handleImgLoad}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="vinyl-disc__art vinyl-disc__art--empty">♫</div>
            )}
          </div>

          {/* Center hole */}
          <div className="vinyl-disc__hole" />
        </div>
      </div>

      {/* Song info */}
      <div className="vinyl-info">
        <h2 className="vinyl-info__title">
          {song?.title ?? 'No song selected'}
        </h2>
        <p className="vinyl-info__artist">{song?.artist ?? ''}</p>
      </div>

      {/* Progress bar */}
      <div className="vinyl-progress">
        <span className="vinyl-progress__time">{formatTime(position)}</span>
        <input
          type="range"
          className="vinyl-progress__bar"
          min={0}
          max={duration || 100}
          value={position}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Seek"
        />
        <span className="vinyl-progress__time">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="vinyl-controls">
        <button
          className={`vinyl-btn ${isShuffled ? 'vinyl-btn--active' : ''}`}
          onClick={onToggleShuffle}
          aria-label="Shuffle"
          title="Shuffle"
        >⇄</button>

        <button className="vinyl-btn vinyl-btn--nav" onClick={onPrev} aria-label="Previous">
          ⏮
        </button>

        <button
          className="vinyl-btn vinyl-btn--play"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button className="vinyl-btn vinyl-btn--nav" onClick={onNext} aria-label="Next">
          ⏭
        </button>

        <button
          className={`vinyl-btn ${repeatMode !== 'none' ? 'vinyl-btn--active' : ''}`}
          onClick={onToggleRepeat}
          aria-label="Repeat"
          title={`Repeat: ${repeatMode}`}
        >
          {repeatMode === 'one' ? '🔂' : '🔁'}
        </button>
      </div>

      {/* Volume */}
      <div className="vinyl-volume">
        <span aria-hidden="true">🔈</span>
        <input
          type="range"
          className="vinyl-volume__slider"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label="Volume"
        />
        <span aria-hidden="true">🔊</span>
      </div>

      {/* Mini progress indicator */}
      <div className="vinyl-progress-ring">
        <svg viewBox="0 0 100 4" preserveAspectRatio="none">
          <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(167,139,250,0.2)" />
          <rect x="0" y="0" width={progress} height="4" rx="2" fill="url(#progressGrad)" />
          <defs>
            <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f9a8d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
