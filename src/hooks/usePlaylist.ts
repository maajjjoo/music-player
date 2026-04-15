import { useState, useCallback, useRef } from 'react';
import { DoublyLinkedList } from '../data-structures/DoublyLinkedList';
import { SAMPLE_SONGS } from '../data/sampleSongs';
import type { SongData, SongNode } from '../models/Song';

export type RepeatMode = 'none' | 'one' | 'all';

export interface PlaylistState {
  songs: SongNode[];
  currentSong: SongNode | null;
  isPlaying: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  showFavoritesOnly: boolean;
  searchQuery: string;
}

export interface PlaylistActions {
  addToStart: (song: SongData) => void;
  addToEnd: (song: SongData) => void;
  addAtPosition: (song: SongData, position: number) => void;
  removeSong: (id: string) => void;
  playNext: () => void;
  playPrev: () => void;
  selectSong: (id: string) => void;
  togglePlay: () => void;
  toggleFavorite: (id: string) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavoritesFilter: () => void;
  setSearchQuery: (query: string) => void;
  getFilteredSongs: () => SongNode[];
}

function buildInitialList(): DoublyLinkedList {
  const dll = new DoublyLinkedList();
  for (const song of SAMPLE_SONGS) {
    dll.addToEnd(song);
  }
  return dll;
}

export function usePlaylist(): PlaylistState & PlaylistActions {
  const dllRef = useRef<DoublyLinkedList>(buildInitialList());

  const [songs, setSongs] = useState<SongNode[]>(() => dllRef.current.toArray());
  const [currentSong, setCurrentSong] = useState<SongNode | null>(
    () => dllRef.current.getCurrent()
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffled, setIsShuffled] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const syncState = useCallback(() => {
    setSongs(dllRef.current.toArray());
    setCurrentSong(dllRef.current.getCurrent());
  }, []);

  const addToStart = useCallback(
    (song: SongData) => {
      dllRef.current.addToStart(song);
      syncState();
    },
    [syncState]
  );

  const addToEnd = useCallback(
    (song: SongData) => {
      dllRef.current.addToEnd(song);
      syncState();
    },
    [syncState]
  );

  const addAtPosition = useCallback(
    (song: SongData, position: number) => {
      dllRef.current.addAtPosition(song, position);
      syncState();
    },
    [syncState]
  );

  const removeSong = useCallback(
    (id: string) => {
      dllRef.current.remove(id);
      syncState();
    },
    [syncState]
  );

  const playNext = useCallback(() => {
    if (repeatMode === 'one' && currentSong !== null) {
      setIsPlaying(true);
      return;
    }
    const next = dllRef.current.next();
    setCurrentSong(next);
    setIsPlaying(next !== null);
  }, [repeatMode, currentSong]);

  const playPrev = useCallback(() => {
    const prev = dllRef.current.prev();
    setCurrentSong(prev);
    setIsPlaying(prev !== null);
  }, []);

  const selectSong = useCallback((id: string) => {
    dllRef.current.setCurrent(id);
    setCurrentSong(dllRef.current.getCurrent());
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      dllRef.current.toggleFavorite(id);
      syncState();
    },
    [syncState]
  );

  const toggleShuffle = useCallback(() => {
    dllRef.current.shuffle();
    setIsShuffled((prev) => !prev);
    syncState();
  }, [syncState]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  }, []);

  const toggleFavoritesFilter = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev);
  }, []);

  const getFilteredSongs = useCallback((): SongNode[] => {
    let list = searchQuery.trim() !== '' ? dllRef.current.search(searchQuery) : songs;
    if (showFavoritesOnly) {
      list = list.filter((s) => s.isFavorite);
    }
    return list;
  }, [songs, searchQuery, showFavoritesOnly]);

  return {
    songs,
    currentSong,
    isPlaying,
    repeatMode,
    isShuffled,
    showFavoritesOnly,
    searchQuery,
    addToStart,
    addToEnd,
    addAtPosition,
    removeSong,
    playNext,
    playPrev,
    selectSong,
    togglePlay,
    toggleFavorite,
    toggleShuffle,
    toggleRepeat,
    toggleFavoritesFilter,
    setSearchQuery,
    getFilteredSongs,
  };
}
