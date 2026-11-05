import type { ZodType } from 'zod';
import type {
  LimaArch,
  LimaLocatorWithDigest,
  MachineInfo,
  Nullish,
} from './types.ts';

export function isNullOrUndefined(thing: unknown): thing is null | undefined {
  return typeof thing === 'undefined' || thing === undefined || thing === null;
}

export function omit<T extends object, K extends keyof T>(
  thing: T,
  keys: K[],
): Omit<T, K> {
  const out = {} as Omit<T, K>;

  for (const [key, value] of Object.entries(thing)) {
    if (keys.includes(key as K)) continue;

    // @ts-expect-error - yes, I can index this, thank you very much
    out[key] = value;
  }

  return out;
}

export function withValidatedField<T extends object, K extends keyof T>(
  thing: T,
  key: K,
  rawValue: string,
  schema: ZodType<NonNullable<T[K]>, string>,
): T {
  const cleared = omit(thing, [key]) as T;
  if (rawValue === '') return cleared;

  const validated = schema.safeParse(rawValue);
  if (!validated.success) return thing;

  return { ...cleared, [key]: validated.data } as T;
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

const TEMPLATE_LOCATOR_PREFIX = 'template:';

export function templateLocator(name: string) {
  return `${TEMPLATE_LOCATOR_PREFIX}${name}`;
}

export function templateNameFromBase(
  base: Nullish<LimaLocatorWithDigest[]>,
): Nullish<string> {
  const url = base?.[0]?.url;
  if (!url?.startsWith(TEMPLATE_LOCATOR_PREFIX)) return null;

  return url.slice(TEMPLATE_LOCATOR_PREFIX.length);
}
