import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { useThemeStore } from '../stores/theme-store.ts';

export function ThemeProvider({ children }: PropsWithChildren) {
  /** store */
  const [color] = useThemeStore('color');

  /** effects */
  useEffect(() => {
    document.documentElement.style.setProperty('--p', color);
  }, [color]);

  return <>{children}</>;
}
