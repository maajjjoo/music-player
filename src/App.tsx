import { useEffect, useCallback, useState } from 'react';
import type { Song } from './models/Song';
import { usePlaylist } from './hooks/usePlaylist';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { getDefaultSongs } from './services/itunesApi';
import { Vinyl } from './components/Vinyl/Vinyl';
import { Playlist } from './components/Playlist/Playlist';
import { SearchBar } from './components/SearchBar/SearchBar';
import './App.css';

export default function App() {
  const playlist = usePlaylist();
  const [bgColor, setBgColor] = useState('#e8d5ff');

  const handleSongEnded = useCallback(() => {
    const next = playlist.playNext();
    if (next?.song.previewUrl) {
      player.play(next.song.previewUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const player = useAudioPlayer(handleSongEnded);

  useEffect(() => {
    getDefaultSongs()
      .then((songs) => {
        songs.forEach((song) => playlist.addToEnd(song));
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePlaySong(id: string) {
    playlist.playSong(id);
    const node = playlist.songs.find((n) => n.song.id === id);
    if (node?.song.previewUrl) {
      player.play(node.song.previewUrl);
    }
  }

  function handlePlayNow(song: Song) {
    playlist.addToEnd(song);
    playlist.playSong(song.id);
    if (song.previewUrl) {
      player.play(song.previewUrl);
    }
  }

  function handleAddAtPosition(song: Song, position: number) {
    playlist.addAtPosition(song, position);
  }

  function handleNext() {
    const next = playlist.playNext();
    if (next?.song.previewUrl) {
      player.play(next.song.previewUrl);
    }
  }

  function handlePrev() {
    const prev = playlist.playPrev();
    if (prev?.song.previewUrl) {
      player.play(prev.song.previewUrl);
    }
  }

  const filteredSongs = playlist.getFilteredSongs();

  return (
    <div
      className="app"
      style={{
        '--dynamic-color': bgColor,
        '--dynamic-color-light': bgColor + '55',
      } as React.CSSProperties}
    >
      {/* Dynamic background blobs */}
      <div className="app__bg">
        <div className="app__blob app__blob--1" />
        <div className="app__blob app__blob--2" />
        <div className="app__blob app__blob--3" />
      </div>

      {/* Header */}
      <header className="app__header">
        <h1 className="app__logo">♫ Vinyl</h1>
        <SearchBar
          query={playlist.searchQuery}
          onQueryChange={playlist.setSearchQuery}
          onAddSong={playlist.addToEnd}
          onAddAtPosition={handleAddAtPosition}
          onPlayNow={handlePlayNow}
          queueSize={playlist.songs.length}
        />
      </header>

      {/* Main two-panel layout */}
      <main className="app__main">
        {/* Left: Vinyl player */}
        <div className="app__vinyl-panel">
          <Vinyl
            currentSong={playlist.currentSong}
            isPlaying={player.isPlaying}
            position={player.position}
            duration={player.duration}
            volume={player.volume}
            repeatMode={playlist.repeatMode}
            isShuffled={playlist.isShuffled}
            onTogglePlay={player.togglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={player.seek}
            onVolumeChange={player.setVolume}
            onToggleRepeat={playlist.toggleRepeat}
            onToggleShuffle={playlist.toggleShuffle}
            onColorExtracted={setBgColor}
          />
        </div>

        {/* Right: Playlist */}
        <div className="app__playlist-panel">
          <Playlist
            songs={filteredSongs}
            currentSong={playlist.currentSong}
            showFavoritesOnly={playlist.showFavoritesOnly}
            onPlay={handlePlaySong}
            onRemove={playlist.removeSong}
            onToggleFavorite={playlist.toggleFavorite}
            onToggleFavoritesFilter={playlist.toggleFavoritesFilter}
            onReorder={playlist.reorderSong}
          />
        </div>
      </main>
    </div>
  );
}
