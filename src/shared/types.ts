import { z } from 'zod';

export * from './creator-types.ts';
export * from './limactl-types.gen.ts';

export type Nullish<T> = T | null | undefined;

export const MachineInfoSchema = z.object({
  /**
   * CPU architecture used for this machine
   */
  arch: z.enum<NodeJS.Architecture[]>([
    'arm',
    'arm64',
    'ia32',
    'loong64',
    'mips',
    'mipsel',
    'ppc64',
    'riscv64',
    's390x',
    'x64',
  ]),
  /**
   * number of available cpus on the machine
   **/
  cpus: z.int().positive(),
  /**
   * operating system for the machine
   */
  platform: z.enum<NodeJS.Platform[]>([
    'aix',
    'android',
    'cygwin',
    'darwin',
    'freebsd',
    'haiku',
    'linux',
    'netbsd',
    'openbsd',
    'sunos',
    'win32',
  ]),
  /**
   * in gigabytes
   */
  ram: z.int().positive(),
});
export type MachineInfo = z.infer<typeof MachineInfoSchema>;
