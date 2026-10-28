import { Tubular } from 'totally-tubular';
import { createUseTubular, createUseTubularReset } from 'totally-tubular/react';
import type { LimaInstance } from '../shared/limactl-types.gen.ts';
import type { Nullish } from '../shared/types.ts';

type InstancesStore = {
  selected: Nullish<LimaInstance>;
};

const store = new Tubular<InstancesStore>({ selected: null });

export const useInstancesStore = createUseTubular(store);
export const useResetInstancesStore = createUseTubularReset(store);
