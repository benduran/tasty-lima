import { Tubular } from 'totally-tubular';
import { createUseTubular, createUseTubularReset } from 'totally-tubular/react';
import type { LimaInstance, Nullish } from '../shared/types.ts';

type InstancesStore = {
  selected: Nullish<LimaInstance>;
};

const store = new Tubular<InstancesStore>({ selected: null });

export const useInstancesStore = createUseTubular(store);
export const useResetInstancesStore = createUseTubularReset(store);
