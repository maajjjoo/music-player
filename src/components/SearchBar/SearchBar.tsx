import { useState } from 'react';
import type { Song } from '../../models/Song';
import { searchTracks } from '../../services/itunesApi';
import './SearchBar.css';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onAddSong: (song: Song) => void;
  onAddToStart: (song: Song) => void;
  onAddAtPosition: (song: Song, position: number) => void;
  onPlayNow: (song: Song) => void;
  queueSize: number;
  onNotification?: (message: string) => void;
  songs?: Array<{ song: Song }>;
}

export function SearchBar({
  query,
  onQueryChange,
  onAddSong,
  onPlayNow,
  onNotification,
  songs = [],
}: SearchBarProps) {
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(value: string) {
    onQueryChange(value);
    if (!value.trim() || value.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    setError(null);
    
    try {
      const tracks = await searchTracks(value);
      setResults(tracks);
    } catch (err: any) {
      console.error('Search error:', err);
      
      // Better error handling
      if (err.name === 'NetworkError' || err.message?.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (err.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Search failed. Please try again.');
      }
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handlePlayNow(song: Song) {
    onPlayNow(song);
    setResults([]);
    onQueryChange('');
  }

  function handleAddToQueue(song: Song) {
    // Check if song already exists in queue
    const exists = songs.some(node => node.song.id === song.id);
    if (exists) {
      onNotification?.(`⚠ ${song.title} is already in queue`);
      return;
    }
    onAddSong(song);
    onNotification?.(`✓ ${song.title} added to queue`);
    // Keep results open so user can add more
  }

  function dismiss() {
    setResults([]);
    onQueryChange('');
  }

  return (
    <div className="sb">
      <div className="sb__wrap">
        <span className="sb__icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          className="sb__input"
          type="search"
          placeholder="Search songs, artists, albums…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Search songs"
          autoComplete="off"
        />
        {isSearching && <span className="sb__spinner" aria-hidden="true" />}
        {query && !isSearching && (
          <button className="sb__clear" onClick={dismiss} aria-label="Clear search">✕</button>
        )}
      </div>

      {error && <p className="sb__error">{error}</p>}

      {results.length > 0 && (
        <ul className="sb__results" role="listbox" aria-label="Search results">
          {results.map((song) => (
            <li key={song.id} className="sb__result" role="option">
              <img className="sb__art" src={song.albumArt} alt={song.album} />
              <div className="sb__info">
                <span className="sb__song-title">{song.title}</span>
                <span className="sb__song-artist">{song.artist}</span>
              </div>
              <div className="sb__actions">
                <button
                  className="sb__btn sb__btn--play"
                  onClick={() => handlePlayNow(song)}
                  aria-label={`Play ${song.title} now`}
                  title="Play now"
                >▶</button>
                <button
                  className="sb__btn sb__btn--add"
                  onClick={() => handleAddToQueue(song)}
                  aria-label={`Add ${song.title} to queue`}
                  title="Add to queue"
                >+ Queue</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
