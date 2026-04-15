import { useEffect, useRef, useState, useCallback } from 'react';
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

// Time formatting utility
const TimeFormatter = {
  format: (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

// Color extraction utility
const ColorExtractor = {
  DEFAULT_COLOR: '#c9b8f5',
  CANVAS_SIZE: 10,
  PASTEL_MIX_RATIO: 0.5,

  extractDominantColor: (imageElement: HTMLImageElement): string => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = ColorExtractor.CANVAS_SIZE;
      canvas.height = ColorExtractor.CANVAS_SIZE;
      
      const context = canvas.getContext('2d');
      if (!context) return ColorExtractor.DEFAULT_COLOR;

      context.drawImage(imageElement, 0, 0, ColorExtractor.CANVAS_SIZE, ColorExtractor.CANVAS_SIZE);
      const imageData = context.getImageData(0, 0, ColorExtractor.CANVAS_SIZE, ColorExtractor.CANVAS_SIZE).data;
      
      const averageColor = ColorExtractor.calculateAverageColor(imageData);
      return ColorExtractor.convertToPastelColor(averageColor);
    } catch (error) {
      console.warn('Failed to extract color from image:', error);
      return ColorExtractor.DEFAULT_COLOR;
    }
  },

  calculateAverageColor: (imageData: Uint8ClampedArray): { r: number; g: number; b: number } => {
    let totalRed = 0;
    let totalGreen = 0;
    let totalBlue = 0;
    
    for (let i = 0; i < imageData.length; i += 4) {
      totalRed += imageData[i];
      totalGreen += imageData[i + 1];
      totalBlue += imageData[i + 2];
    }
    
    const pixelCount = imageData.length / 4;
    return {
      r: totalRed / pixelCount,
      g: totalGreen / pixelCount,
      b: totalBlue / pixelCount
    };
  },

  convertToPastelColor: (color: { r: number; g: number; b: number }): string => {
    const pastelRed = Math.floor((color.r + 255) * ColorExtractor.PASTEL_MIX_RATIO);
    const pastelGreen = Math.floor((color.g + 255) * ColorExtractor.PASTEL_MIX_RATIO);
    const pastelBlue = Math.floor((color.b + 255) * ColorExtractor.PASTEL_MIX_RATIO);
    
    return `rgb(${pastelRed}, ${pastelGreen}, ${pastelBlue})`;
  }
};

// Custom hook for vinyl animation
const useVinylAnimation = (isPlaying: boolean) => {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  
  const ROTATION_SPEED = 0.03;
  const FULL_ROTATION = 360;

  const startAnimation = useCallback(() => {
    const animate = (timestamp: number) => {
      if (lastTimestampRef.current) {
        const deltaTime = timestamp - lastTimestampRef.current;
        rotationRef.current = (rotationRef.current + deltaTime * ROTATION_SPEED) % FULL_ROTATION;
        setRotation(rotationRef.current);
      }
      lastTimestampRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    lastTimestampRef.current = 0;
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [isPlaying, startAnimation, stopAnimation]);

  return rotation;
};

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
  const imageRef = useRef<HTMLImageElement>(null);
  const rotation = useVinylAnimation(isPlaying);

  // Handle image load and color extraction
  const handleImageLoad = (): void => {
    if (imageRef.current) {
      const extractedColor = ColorExtractor.extractDominantColor(imageRef.current);
      onColorExtracted(extractedColor);
    }
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className="vinyl-panel">
      {/* Enhanced Turntable Base */}
      <div className="turntable">
        {/* Tonearm */}
        <div className={`tonearm ${isPlaying ? 'tonearm--playing' : ''}`}>
          <div className="tonearm__arm" />
          <div className="tonearm__head" />
        </div>

        {/* Larger Vinyl Disc */}
        <div
          className="vinyl-disc"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Enhanced Grooves */}
          <div className="vinyl-disc__grooves" />

          {/* Larger Center Label with Album Art */}
          <div className="vinyl-disc__label">
            {song?.albumArt ? (
              <img
                ref={imageRef}
                src={song.albumArt}
                alt={song.album}
                className="vinyl-disc__art"
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="vinyl-disc__art vinyl-disc__art--empty">♫</div>
            )}
          </div>

          {/* Center Hole */}
          <div className="vinyl-disc__hole" />
        </div>
      </div>

      {/* Song Information */}
      <div className="vinyl-info">
        <h2 className="vinyl-info__title">
          {song?.title ?? 'No song selected'}
        </h2>
        <p className="vinyl-info__artist">{song?.artist ?? ''}</p>
      </div>

      {/* Progress Bar */}
      <div className="vinyl-progress">
        <span className="vinyl-progress__time">{TimeFormatter.format(position)}</span>
        <input
          type="range"
          className="vinyl-progress__bar"
          min={0}
          max={duration || 100}
          value={position}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Seek"
        />
        <span className="vinyl-progress__time">{TimeFormatter.format(duration)}</span>
      </div>

      {/* Control Buttons */}
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

      {/* Volume Control */}
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

      {/* Enhanced Progress Ring */}
      <div className="vinyl-progress-ring">
        <svg viewBox="0 0 100 4" preserveAspectRatio="none">
          <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(167,139,250,0.2)" />
          <rect x="0" y="0" width={progressPercentage} height="4" rx="2" fill="url(#progressGradient)" />
          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f9a8d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
