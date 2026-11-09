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

export function bytesToGb(bytes: Nullish<number | string>) {
  if (!bytes) return 0;
  const num = typeof bytes === 'string' ? Number.parseInt(bytes, 10) : bytes;
  return Math.ceil(num / 1024 ** 3);
}

export function bareNumberStrToGiBStr(value: string | undefined) {
  return typeof value === 'string' && /^\d+$/.test(value)
    ? `${value}GiB`
    : value;
}

/** go-units-style unit suffixes: bare = bytes, KB/MB/... decimal, KiB/MiB/... binary */
const BYTES_PER_UNIT: Record<string, number> = {
  b: 1,
  g: 1024 ** 3,
  gb: 1_000_000_000,
  gib: 1024 ** 3,
  k: 1024,
  kb: 1000,
  kib: 1024,
  m: 1024 ** 2,
  mb: 1_000_000,
  mib: 1024 ** 2,
  t: 1024 ** 4,
  tb: 1_000_000_000_000,
  tib: 1024 ** 4,
};

/** Parses a Lima/go-units byte-size string ("8GiB", "512M", "1.5GB") to whole GiB. */
export function GiBStringToBareNumber(gibStr: Nullish<string>) {
  if (isNullOrUndefined(gibStr)) return gibStr;

  const match = /^([\d.]+)\s*([a-zA-Z]*)$/.exec(gibStr.trim());
  if (!match) return null;

  const magnitude = Number.parseFloat(match[1] ?? '');
  const unitBytes =
    match[2] === undefined ? undefined : BYTES_PER_UNIT[match[2].toLowerCase()];
  if (!Number.isFinite(magnitude) || unitBytes === undefined) return null;

  return Math.ceil((magnitude * unitBytes) / 1024 ** 3);
}

/**
 * Bare-number-string twin of GiBStringToBareNumber, for form stores that hold
 * "10" instead of "10GiB". Unrecognized strings pass through unchanged so the
 * error stays visible instead of silently becoming NaN.
 */
export function GiBStringToBareNumberStr(value: Nullish<string>) {
  if (isNullOrUndefined(value)) return undefined;
  return String(GiBStringToBareNumber(value) ?? value);
}
