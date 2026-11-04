import { Tubular } from 'totally-tubular';
import { createUseTubular } from 'totally-tubular/react';
import { z } from 'zod';
import type { Nullish } from '../shared/types.ts';
import {
  readFromLocalStorage,
  setToLocalStorage,
  subscribeToLocalStorage,
} from './local-storage.ts';

export const ColorHexSchema = z
  .string()
  .regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    error: 'please specify a valid hexadecimal color code',
  });

export const PRESET_THEMES = {
  amber: '#ffb000',
  blue: '#6CC6FF',
  green: '#33ff66',
  white: '#e8f1f2',
} as const;

type ThemePreset = keyof typeof PRESET_THEMES;

export const DEFAULT_THEME: ThemePreset = 'blue';

type ThemeStore = {
  color: string;
};

const THEME_KEY = 'tasty-lima-theme' as const;

const toTheme = (str: Nullish<string>) => {
  const validated = ColorHexSchema.safeParse(str);
  return validated.success ? validated.data : PRESET_THEMES.blue;
};

const store = new Tubular<ThemeStore>({
  color: readFromLocalStorage(THEME_KEY, toTheme) ?? PRESET_THEMES.blue,
});

store.observe('color', color => setToLocalStorage(THEME_KEY, () => color));

subscribeToLocalStorage(THEME_KEY, (_key, val) => {
  const nextColor = toTheme(val);
  if (nextColor === store.read('color')) return;

  store.update('color', () => nextColor);
});

export const useThemeStore = createUseTubular(store);
