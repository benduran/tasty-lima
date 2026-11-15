import { Tubular } from 'totally-tubular';
import { createUseTubular, createUseTubularReset } from 'totally-tubular/react';
import type { LogLine } from '../shared/types.ts';

type InstanceLogsState = {
  logs: Record<string, LogLine[]>;
};

const store = new Tubular<InstanceLogsState>({
  logs: {},
});

export const useInstanceLogsStore = createUseTubular(store);
export const useResetInstanceLogsStore = createUseTubularReset(store);

export function clearInstanceLogs(name: string) {
  store.update('logs', prev => ({ ...prev, [name]: [] }));
}
