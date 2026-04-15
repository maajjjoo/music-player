import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
}

export function useKeyboardShortcuts({
  onPlayPause,
  onNext,
  onPrev,
  onVolumeUp,
  onVolumeDown,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onVolumeUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onVolumeDown();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onPlayPause, onNext, onPrev, onVolumeUp, onVolumeDown]);
}
