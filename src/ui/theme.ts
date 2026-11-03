import { useColorScheme } from 'react-native';
import { useSyncExternalStore } from 'react';

import { getSnapshot, subscribe } from '../settings/store';

export type Theme = {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  onAccent: string;
  danger: string;
};

const LIGHT: Theme = {
  bg: '#ffffff',
  surface: '#f4f4f5',
  text: '#18181b',
  muted: '#71717a',
  border: '#e4e4e7',
  accent: '#2563eb',
  onAccent: '#ffffff',
  danger: '#dc2626',
};

const DARK: Theme = {
  bg: '#09090b',
  surface: '#18181b',
  text: '#f4f4f5',
  muted: '#a1a1aa',
  border: '#3f3f46',
  accent: '#3b82f6',
  onAccent: '#ffffff',
  danger: '#f87171',
};

export type ThemeMode = 'system' | 'dark' | 'light';

export function useTheme(): { dark: boolean; c: Theme; mode: ThemeMode } {
  const scheme = useColorScheme();
  const mode = useSyncExternalStore(
    subscribe,
    () => getSnapshot().theme,
    () => getSnapshot().theme,
  );
  const dark = mode === 'dark' || (mode === 'system' && scheme === 'dark');
  return { dark, c: dark ? DARK : LIGHT, mode };
}
