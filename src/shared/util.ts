import type { LimaArch, MachineInfo, Nullish } from './types.ts';

export function isNullOrUndefined(thing: unknown): thing is null | undefined {
  return typeof thing === 'undefined' || thing === undefined || thing === null;
}

export function isObject(thing: unknown) {
  return !isNullOrUndefined(thing) && typeof thing === 'object';
}

export function arrayHasItems<T>(arr: Nullish<T[]>): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

export function machineInfoArchToLimaArch(
  machineInfoArch: Nullish<MachineInfo['arch']>,
): Nullish<LimaArch> {
  switch (machineInfoArch) {
    case 'arm64':
      return 'aarch64';
    case 'ppc64':
      return 'ppc64le';
    case 'riscv64':
      return 'riscv64';
    case 's390x':
      return 's390x';
    case 'x64':
      return 'x86_64';
    default:
      return null;
  }
}
