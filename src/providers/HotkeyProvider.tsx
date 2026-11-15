import type { PropsWithChildren } from 'react';
import { useLayoutEffect } from 'react';
import { isKnownHotkey, useHotkeyStore } from '../stores/hotkey-store.ts';

export function HotkeysProvider({ children }: PropsWithChildren) {
  /** store */
  const [, setKeys] = useHotkeyStore('keys');

  /** effects */
  useLayoutEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (!isKnownHotkey(e.key)) return;
      // @ts-expect-error - optional types can be safely spread
      setKeys(prev => ({ ...prev, [e.key]: true }));
    };
    const keyupHandler = (e: KeyboardEvent) => {
      if (!isKnownHotkey(e.key)) return;
      // @ts-expect-error - optional types can be safely spread
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);

    return () => {
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('keyup', keyupHandler);
    };
  }, [setKeys]);

  return children;
}
