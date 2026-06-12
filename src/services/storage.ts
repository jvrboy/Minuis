import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, SignalHistoryEntry } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const KEYS = {
  SETTINGS: '@minuis_settings',
  HISTORY: '@minuis_history',
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch { }
}

export async function loadHistory(): Promise<SignalHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return [];
}

export async function saveHistory(history: SignalHistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 500)));
  } catch { }
}
