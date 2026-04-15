import { useRef } from 'react';
import type { SongNode } from '../../models/Song';
import { SongItem } from './SongItem';
import './Playlist.css';

interface PlaylistProps {
  songs: SongNode[];
  currentSong: SongNode | null;
  showFavoritesOnly: boolean;
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleFavoritesFilter: () => void;
  onReorder: (fromId: string, toId: string) => void;
  onClose: () => void;
}

export function Playlist({
  songs,
  currentSong,
  showFavoritesOnly,
  onPlay,
  onRemove,
  onToggleFavorite,
  onToggleFavoritesFilter,
  onReorder,
  onClose,
}: PlaylistProps) {
  const draggedId = useRef<string | null>(null);

  function handleDragStart(id: string) {
    draggedId.current = id;
  }

  function handleDrop(targetId: string) {
    if (draggedId.current && draggedId.current !== targetId) {
      onReorder(draggedId.current, targetId);
    }
    draggedId.current = null;
  }

  return (
    <section className="playlist">
      <div className="playlist__header">
        <h2 className="playlist__title">Queue <span className="playlist__count">{songs.length}</span></h2>
        <div className="playlist__header-actions">
          <button
            className={`playlist__filter-btn ${showFavoritesOnly ? 'playlist__filter-btn--active' : ''}`}
            onClick={onToggleFavoritesFilter}
            aria-pressed={showFavoritesOnly}
          >
            {showFavoritesOnly ? '♥ Favorites' : '♡ Favorites'}
          </button>
          <button
            className="playlist__close-btn"
            onClick={onClose}
            aria-label="Close playlist"
            title="Close playlist"
          >
            ✕
          </button>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="playlist__empty">
          <p>
            {showFavoritesOnly
              ? 'No favorite songs yet. Heart a song to add it here.'
              : 'Your queue is empty. Search for songs to add them.'}
          </p>
        </div>
      ) : (
        <ul className="playlist__list" role="list" aria-label="Song queue">
          {songs.map((node) => (
            <SongItem
              key={node.song.id}
              node={node}
              isActive={currentSong?.song.id === node.song.id}
              onPlay={onPlay}
              onRemove={onRemove}
              onToggleFavorite={onToggleFavorite}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
