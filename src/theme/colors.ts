import { useStore } from '../store/useStore';
import { COLORS as DARK, LIGHT_COLORS as LIGHT } from '../constants';

export type ColorSet = typeof DARK;

export function useColors(): ColorSet {
  const theme = useStore((s) => s.settings.theme);
  return theme === 'light' ? LIGHT : DARK;
}

export function getColors(theme: 'dark' | 'light'): ColorSet {
  return theme === 'light' ? LIGHT : DARK;
}
