import { useRef } from 'react';
import type { SongNode } from '../../models/Song';

interface SongItemProps {
  node: SongNode;
  isActive: boolean;
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (targetId: string) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SongItem({
  node,
  isActive,
  onPlay,
  onRemove,
  onToggleFavorite,
  onDragStart,
  onDrop,
}: SongItemProps) {
  const { song } = node;
  const dragOverRef = useRef(false);

  return (
    <li
      className={`song-item ${isActive ? 'song-item--active' : ''}`}
      draggable
      onDragStart={() => onDragStart(song.id)}
      onDragOver={(e) => {
        e.preventDefault();
        dragOverRef.current = true;
        e.currentTarget.classList.add('song-item--drag-over');
      }}
      onDragLeave={(e) => {
        dragOverRef.current = false;
        e.currentTarget.classList.remove('song-item--drag-over');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('song-item--drag-over');
        onDrop(song.id);
      }}
    >
      <span className="song-item__drag-handle" aria-hidden="true">⠿</span>

      <button
        className="song-item__play-area"
        onClick={() => onPlay(song.id)}
        aria-label={`Play ${song.title}`}
      >
        <img className="song-item__art" src={song.albumArt} alt={song.album} />
        <div className="song-item__info">
          <span className="song-item__title">{song.title}</span>
          <span className="song-item__artist">{song.artist}</span>
        </div>
      </button>

      <span className="song-item__album">{song.album}</span>
      <span className="song-item__duration">{formatDuration(song.duration)}</span>

      <div className="song-item__actions">
        <button
          className={`song-item__btn ${song.isFavorite ? 'song-item__btn--favorite' : ''}`}
          onClick={() => onToggleFavorite(song.id)}
          aria-label={song.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {song.isFavorite ? '♥' : '♡'}
        </button>
        <button
          className="song-item__btn song-item__btn--remove"
          onClick={() => onRemove(song.id)}
          aria-label={`Remove ${song.title}`}
        >
          ✕
        </button>
      </div>
    </li>
  );
}
