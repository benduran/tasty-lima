import { Tubular } from 'totally-tubular';
import { createUseTubular, createUseTubularReset } from 'totally-tubular/react';
import type { LimaYAMLInput } from '../shared/types.ts';

type NewVMStore = {
  config: LimaYAMLInput;
  name: string;
  startAfterCreate: boolean;
};

const store = new Tubular<NewVMStore>({
  config: { ssh: { forwardAgent: true } },
  name: '',
  startAfterCreate: true,
});

export const useNewVMStore = createUseTubular(store);
export const useResetNewVMStore = createUseTubularReset(store);
