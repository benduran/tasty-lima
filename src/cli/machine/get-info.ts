import os from 'node:os';
import { checkDiskSpace } from 'check-disk-space';
import type { MachineInfo, Nullish } from '../../shared/types.ts';
import { MachineInfoSchema } from '../../shared/types.ts';

const cache: { machineInfo: Nullish<MachineInfo> } = { machineInfo: null };

export async function getMachineInfo() {
  if (cache.machineInfo) return cache.machineInfo;

  const arch = os.arch();
  const platform = os.platform();
  const cpus = os.cpus().length;
  const ram = Math.ceil(os.totalmem() / 1024 ** 3);
  const usage = await checkDiskSpace(import.meta.dirname);

  cache.machineInfo = MachineInfoSchema.parse({
    arch,
    cpus,
    diskSpace: Math.ceil(usage.size / 1024 ** 3),
    platform,
    ram,
  } satisfies MachineInfo);

  return cache.machineInfo;
}
