import { Tubular } from 'totally-tubular';
import { createUseTubular, createUseTubularReset } from 'totally-tubular/react';
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

export const useNewVMStore = createUseTubular(store);
export const useResetNewVMStore = createUseTubularReset(store);
