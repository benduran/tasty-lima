import { useCallback } from 'react';
import { Tubular } from 'totally-tubular';
import { createUseTubular, createUseTubularReset } from 'totally-tubular/react';
import { useLocation } from 'wouter';
import type { CreateLimaVM } from '../shared/types.ts';

export type NewVMUiState = {
  configMode: 'form' | 'yaml';
  rawYaml: string;
};
export type NewVMState = CreateLimaVM & NewVMUiState;

const store = new Tubular<NewVMState>({
  config: { ssh: { forwardAgent: true } },
  configMode: 'form',
  name: '',
  rawYaml: '',
  startAfterCreate: true,
});

export const LOG_VIEWER_QUERY_PARAM = 'logs' as const;

export const useNewVMStore = createUseTubular(store);
export const useResetNewVMStore = createUseTubularReset(store);
export function useOpenLogsViewer() {
  /** routing */
  const [location, setLocation] = useLocation();

  return useCallback(
    (vmName: string) => {
      const url = new URL(location, window.location.origin);
      url.searchParams.set(LOG_VIEWER_QUERY_PARAM, vmName);
      setLocation(url.toString());
    },
    [location, setLocation],
  );
}

export function useCloseLogsViewer() {
  const [location, setLocation] = useLocation();

  return useCallback(() => {
    const url = new URL(location, window.location.origin);
    url.searchParams.delete(LOG_VIEWER_QUERY_PARAM);
    setLocation(url.toString());
  }, [location, setLocation]);
}
