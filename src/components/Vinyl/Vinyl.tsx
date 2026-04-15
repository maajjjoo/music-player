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

// Vintage Time Formatter Class
class VintageTimeFormatter {
  static format(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Vintage Color Extractor Class
class VintageColorExtractor {
  private static readonly DEFAULT_SEPIA = '#f4f1e8';
  private static readonly CANVAS_SIZE = 12;

  static extractWarmTone(imageElement: HTMLImageElement): string {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.CANVAS_SIZE;
      canvas.height = this.CANVAS_SIZE;
      
      const context = canvas.getContext('2d');
      if (!context) return this.DEFAULT_SEPIA;

      context.drawImage(imageElement, 0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
      const imageData = context.getImageData(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE).data;
      
      const averageColor = this.calculateAverageColor(imageData);
      return this.convertToVintageSepia(averageColor);
    } catch (error) {
      console.warn('Failed to extract vintage color:', error);
      return this.DEFAULT_SEPIA;
    }
  }

  private static calculateAverageColor(imageData: Uint8ClampedArray): { r: number; g: number; b: number } {
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
  }

  private static convertToVintageSepia(color: { r: number; g: number; b: number }): string {
    // Apply sepia tone transformation
    const sepiaR = Math.min(255, (color.r * 0.393) + (color.g * 0.769) + (color.b * 0.189));
    const sepiaG = Math.min(255, (color.r * 0.349) + (color.g * 0.686) + (color.b * 0.168));
    const sepiaB = Math.min(255, (color.r * 0.272) + (color.g * 0.534) + (color.b * 0.131));
    
    // Blend with warm cream for vintage feel
    const vintageR = Math.floor((sepiaR + 250) * 0.6);
    const vintageG = Math.floor((sepiaG + 247) * 0.6);
    const vintageB = Math.floor((sepiaB + 240) * 0.6);
    
    return `rgb(${vintageR}, ${vintageG}, ${vintageB})`;
  }
}

// Vintage Turntable Animation Controller
const createVinylTurntableController = (onRotationUpdate: (rotation: number) => void) => {
  let rotationValue = 0;
  let animationFrameId = 0;
  let lastTimestamp = 0;
  const VINTAGE_RPM = 33.33; // Classic 33⅓ RPM
  const ROTATION_SPEED = (VINTAGE_RPM * 360) / (60 * 1000); // degrees per millisecond

  const startSpinning = (): void => {
    const animate = (timestamp: number) => {
      if (lastTimestamp) {
        const deltaTime = timestamp - lastTimestamp;
        rotationValue = (rotationValue + deltaTime * ROTATION_SPEED) % 360;
        onRotationUpdate(rotationValue);
      }
      lastTimestamp = timestamp;
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
  };

  const stopSpinning = (): void => {
    cancelAnimationFrame(animationFrameId);
    lastTimestamp = 0;
  };

  const cleanup = (): void => {
    stopSpinning();
  };

  return { startSpinning, stopSpinning, cleanup };
};

// Custom hook for vintage vinyl animation
const useVintageVinylAnimation = (isPlaying: boolean) => {
  const [rotation, setRotation] = useState(0);
  const controllerRef = useRef<ReturnType<typeof createVinylTurntableController> | null>(null);

  useEffect(() => {
    controllerRef.current = createVinylTurntableController(setRotation);
    return () => {
      controllerRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    if (isPlaying) {
      controller.startSpinning();
    } else {
      controller.stopSpinning();
    }
  }, [isPlaying]);

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
  const rotation = useVintageVinylAnimation(isPlaying);

  // Handle vintage color extraction
  const handleImageLoad = useCallback((): void => {
    if (imageRef.current) {
      const vintageColor = VintageColorExtractor.extractWarmTone(imageRef.current);
      onColorExtracted(vintageColor);
    }
  }, [onColorExtracted]);

  const [soundWaveHeights] = useState<string[]>(() =>
    Array.from({ length: 12 }, () => `${20 + Math.random() * 30}px`)
  );

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className={`vintage-turntable ${isPlaying ? 'vintage-turntable--playing' : ''}`}>
      {/* Turntable Base */}
      <div className="turntable-base">
        {/* Vintage Tonearm */}
        <div className={`vintage-tonearm ${isPlaying ? 'vintage-tonearm--playing' : ''}`}>
          <div className="tonearm-pivot" />
          <div className="tonearm-arm" />
          <div className="tonearm-cartridge" />
        </div>

        {/* Vintage Vinyl Record */}
        <div
          className="vintage-vinyl-record"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Sound Wave Visualizer */}
          {isPlaying && (
            <div className="sound-wave-visualizer">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="sound-wave-bar"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: soundWaveHeights[i]
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Record Grooves */}
          <div className="record-grooves" />
          
          {/* Center Label */}
          <div className="record-center-label">
            {song?.albumArt ? (
              <img
                ref={imageRef}
                src={song.albumArt}
                alt={song.album}
                className="record-album-art"
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="record-album-art record-album-art--empty">
                <span className="vintage-music-note">♪</span>
              </div>
            )}
            
            {/* Song Info Overlay */}
            <div className="record-song-overlay">
              <div className="record-song-title">
                {song?.title ?? 'Select a Record'}
              </div>
              <div className="record-song-artist">
                {song?.artist ?? ''}
              </div>
            </div>
          </div>

          {/* Center Spindle */}
          <div className="record-spindle" />
        </div>

        {/* Turntable Platter */}
        <div className="turntable-platter" />
      </div>

      {/* Vintage Control Panel */}
      <div className="vintage-control-panel">
        {/* Progress Display */}
        <div className="vintage-progress-display">
          <div className="progress-time-display">
            <span className="time-current">{VintageTimeFormatter.format(position)}</span>
            <span className="time-separator">•</span>
            <span className="time-total">{VintageTimeFormatter.format(duration)}</span>
          </div>
          
          <div className="vintage-progress-track">
            <input
              type="range"
              className="vintage-progress-slider"
              min={0}
              max={duration || 100}
              value={position}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Track Progress"
            />
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>
        </div>

        {/* Transport Controls */}
        <div className="vintage-transport-controls">
          <button
            className={`vintage-control-btn shuffle-btn ${isShuffled ? 'active' : ''}`}
            onClick={onToggleShuffle}
            aria-label="Shuffle"
            title="Shuffle Playlist"
          >
            <span className="btn-icon">⇄</span>
          </button>

          <button 
            className="vintage-control-btn prev-btn" 
            onClick={onPrev} 
            aria-label="Previous Track"
          >
            <span className="btn-icon">⏮</span>
          </button>

          <button
            className="vintage-control-btn play-btn"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="btn-icon">
              {isPlaying ? '⏸' : '▶'}
            </span>
          </button>

          <button 
            className="vintage-control-btn next-btn" 
            onClick={onNext} 
            aria-label="Next Track"
          >
            <span className="btn-icon">⏭</span>
          </button>

          <button
            className={`vintage-control-btn repeat-btn ${repeatMode !== 'none' ? 'active' : ''}`}
            onClick={onToggleRepeat}
            aria-label="Repeat"
            title={`Repeat: ${repeatMode}`}
          >
            <span className="btn-icon">
              {repeatMode === 'one' ? '🔂' : '🔁'}
            </span>
          </button>
        </div>

        {/* Volume Control */}
        <div className="vintage-volume-control">
          <span className="volume-icon volume-low" aria-hidden="true">🔈</span>
          <div className="volume-slider-container">
            <input
              type="range"
              className="vintage-volume-slider"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>
          <span className="volume-icon volume-high" aria-hidden="true">🔊</span>
        </div>
      </div>
    </div>
  );
}
