import os from 'node:os';
import type { MachineInfo, Nullish } from '../../shared/types.ts';
import { MachineInfoSchema } from '../../shared/types.ts';

const cache: { machineInfo: Nullish<MachineInfo> } = { machineInfo: null };

export function getMachineInfo() {
  if (cache.machineInfo) return cache.machineInfo;

  const arch = os.arch();
  const platform = os.platform();
  const cpus = os.cpus().length;
  const ram = Math.ceil(os.totalmem() / 1024 ** 3);

  cache.machineInfo = MachineInfoSchema.parse({
    arch,
    cpus,
    platform,
    ram,
  } satisfies MachineInfo);

  return cache.machineInfo;
}
