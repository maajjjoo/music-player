import { useRef, useState, useCallback, useEffect } from 'react';
import type { SongNode } from '../../models/Song';
import './CoverShelf.css';

interface CoverShelfProps {
  songs: SongNode[];
  currentSong: SongNode | null;
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
}

// Utility: duration formatter
const DurationFormatter = {
  format(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },
};

// Utility: drag state manager
const createDragState = () => ({
  draggedId: null as string | null,
  overId: null as string | null,
});

export function CoverShelf({ songs, currentSong, onPlay, onRemove, onReorder }: CoverShelfProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef(createDragState());
  const [overId, setOverId] = useState<string | null>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auto-scroll handler ────────────────────────────────────────────────────

  const startAutoScroll = useCallback((direction: 'left' | 'right') => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    
    scrollIntervalRef.current = setInterval(() => {
      if (trackRef.current) {
        const scrollAmount = 5; // Slower scroll
        trackRef.current.scrollLeft += direction === 'right' ? scrollAmount : -scrollAmount;
      }
    }, 30); // Smoother interval
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = useCallback((id: string, e: React.DragEvent) => {
    dragState.current.draggedId = id;
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
  }, []);

  const handleDragOver = useCallback((id: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragState.current.draggedId !== id) {
      setOverId(id);
      dragState.current.overId = id;

      // Auto-scroll logic
      if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        const mouseX = e.clientX;
        const threshold = 80;

        if (mouseX < rect.left + threshold) {
          startAutoScroll('left');
        } else if (mouseX > rect.right - threshold) {
          startAutoScroll('right');
        } else {
          stopAutoScroll();
        }
      }
    }
  }, [startAutoScroll, stopAutoScroll]);

  const handleDrop = useCallback((targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    stopAutoScroll();
    const fromId = dragState.current.draggedId;
    if (fromId && fromId !== targetId) {
      onReorder(fromId, targetId);
    }
    dragState.current.draggedId = null;
    dragState.current.overId = null;
    setOverId(null);
  }, [onReorder, stopAutoScroll]);

  const handleDragEnd = useCallback(() => {
    stopAutoScroll();
    dragState.current.draggedId = null;
    dragState.current.overId = null;
    setOverId(null);
  }, [stopAutoScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // ── Empty state ────────────────────────────────────────────────────────────

  if (songs.length === 0) {
    return (
      <div className="shelf shelf--empty">
        <div className="shelf__empty-icon">♫</div>
        <p className="shelf__empty-text">Search for songs and add them to your queue</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="shelf">
      <div className="shelf__track" ref={trackRef}>
        {songs.map((node) => {
          const { song } = node;
          const isActive = currentSong?.song.id === song.id;
          const isDragOver = overId === song.id;

          return (
            <div
              key={song.id}
              className={[
                'shelf__item',
                isActive   ? 'shelf__item--active'    : '',
                isDragOver ? 'shelf__item--drag-over' : '',
              ].join(' ').trim()}
              draggable
              onDragStart={(e) => handleDragStart(song.id, e)}
              onDragOver={(e) => handleDragOver(song.id, e)}
              onDrop={(e) => handleDrop(song.id, e)}
              onDragEnd={handleDragEnd}
              onDragLeave={() => setOverId(null)}
              onClick={() => onPlay(song.id)}
              role="button"
              tabIndex={0}
              aria-label={`Play ${song.title} by ${song.artist}`}
              onKeyDown={(e) => e.key === 'Enter' && onPlay(song.id)}
            >
              {/* Cover */}
              <div className="shelf__cover-wrap">
                <img
                  className="shelf__cover"
                  src={song.albumArt}
                  alt={song.album}
                  draggable={false}
                />

                {/* Playing bars */}
                {isActive && (
                  <div className="shelf__playing-badge" aria-hidden="true">
                    <span className="shelf__bar" />
                    <span className="shelf__bar" />
                    <span className="shelf__bar" />
                    <span className="shelf__bar" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="shelf__overlay" aria-hidden="true">
                  <div className="shelf__overlay-play">▶</div>
                </div>

                {/* Remove */}
                <button
                  className="shelf__remove"
                  onClick={(e) => { e.stopPropagation(); onRemove(song.id); }}
                  aria-label={`Remove ${song.title}`}
                  title="Remove"
                >✕</button>

                {/* Drag handle hint */}
                <div className="shelf__drag-hint" aria-hidden="true">⠿</div>
              </div>

              {/* Info */}
              <div className="shelf__info">
                <span className="shelf__song-title">{song.title}</span>
                <span className="shelf__song-artist">{song.artist}</span>
                <span className="shelf__song-duration">{DurationFormatter.format(song.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
