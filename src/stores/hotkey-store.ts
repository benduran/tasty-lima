import { Tubular } from 'totally-tubular';
import { createUseTubular } from 'totally-tubular/react';

type HotkeysProviderVal = {
  keys: {
    F1: boolean;
    F2: boolean;
    F3: boolean;
    F4: boolean;
    F5: boolean;
    F6: boolean;
    F7: boolean;
    F8: boolean;
    F9: boolean;
    F10: boolean;
    F11: boolean;
    F12: boolean;
  };
};

const initialStore: HotkeysProviderVal = {
  keys: {
    F1: false,
    F2: false,
    F3: false,
    F4: false,
    F5: false,
    F6: false,
    F7: false,
    F8: false,
    F9: false,
    F10: false,
    F11: false,
    F12: false,
  },
};

const store = new Tubular<HotkeysProviderVal>(initialStore);

export function isKnownHotkey(
  eventKey: string,
): eventKey is keyof HotkeysProviderVal['keys'] {
  return eventKey in initialStore.keys;
}

export const useHotkeyStore = createUseTubular(store);
