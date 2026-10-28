import { useCallback, useEffect, useState } from 'react';

export const PHOSPHOR_VARIANTS = ['blue', 'green', 'amber', 'pale'] as const;

export type PhosphorVariant = (typeof PHOSPHOR_VARIANTS)[number];

export const PHOSPHOR_COLORS: Record<PhosphorVariant, string> = {
  amber: '#ffb000',
  blue: '#6cc6ff',
  green: '#33ff66',
  pale: '#e8f1f2',
};

const STORAGE_KEY = 'tasty-lima-theme' as const;

function isPhosphorVariant(
  value: string | null | undefined,
): value is PhosphorVariant {
  return (PHOSPHOR_VARIANTS as readonly string[]).includes(value ?? '');
}

function readInitialVariant(): PhosphorVariant {
  if (typeof window === 'undefined') {
    return 'blue';
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isPhosphorVariant(stored)) {
    return stored;
  }
  const attr = document.documentElement.dataset.theme;
  if (isPhosphorVariant(attr)) {
    return attr;
  }
  return 'blue';
}

export function useTheme() {
  const [theme, setTheme] = useState<PhosphorVariant>(readInitialVariant);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* no-op */
    }
  }, [theme]);

  const setVariant = useCallback((variant: PhosphorVariant) => {
    setTheme(variant);
  }, []);

  return { setVariant, theme };
}
