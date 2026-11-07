import { Tubular } from 'totally-tubular';
import { createUseTubular, createUseTubularReset } from 'totally-tubular/react';
import type { CreateLimaVM } from '../shared/types.ts';

const store = new Tubular<CreateLimaVM>({
  config: { ssh: { forwardAgent: true } },
  name: '',
  startAfterCreate: true,
});

export const useNewVMStore = createUseTubular(store);
export const useResetNewVMStore = createUseTubularReset(store);
