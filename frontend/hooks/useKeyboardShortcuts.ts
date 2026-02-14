import { useEffect } from 'react';
import type { View } from '../store';

interface UseKeyboardShortcutsOptions {
  onNewManualEntry?: () => void;
  onNavigate?: (view: View) => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { onNewManualEntry, onNavigate } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new manual entry
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onNewManualEntry?.();
      }
      // Ctrl/Cmd + 1-5 for navigation
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const views: View[] = ['dashboard', 'history', 'reports', 'settings', 'marketplace'];
        const viewIndex = parseInt(e.key) - 1;
        if (viewIndex >= 0 && viewIndex < views.length) {
          onNavigate?.(views[viewIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewManualEntry, onNavigate]);
}
