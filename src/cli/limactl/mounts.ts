import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import type { LimaMount, Nullish } from '../../shared/types.ts';
import { arrayHasItems } from '../../shared/util.ts';

const ALTERNATE_GUEST_HOME_BASENAME = '{{.User}}.linux';

export const FilledMountSchema = z.object({
  location: z.string().nullish(),
  mountPoint: z.string().nullish(),
  writable: z.boolean().nullish(),
});
export type FilledMount = z.infer<typeof FilledMountSchema>;

export function mountsForConfig(requested: LimaMount[]): Nullish<LimaMount[]> {
  return arrayHasItems(requested) ? requested : null;
}

export function guestHomeClearOfMounts(
  guestHome: string,
  filled: FilledMount[],
): Nullish<string> {
  if (!filled.some(mount => mount.mountPoint === guestHome)) return null;
  return path.posix.join(
    path.posix.dirname(guestHome),
    ALTERNATE_GUEST_HOME_BASENAME,
  );
}

function expandTilde(location: string) {
  if (location === '~') return os.homedir();
  if (location.startsWith('~/')) {
    return path.join(os.homedir(), location.slice(2));
  }
  return location;
}

function hostPathKey(location: string) {
  const normalized = path.normalize(expandTilde(location));
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function describeMount({ location, mountPoint, writable }: FilledMount) {
  return `${location ?? '?'} -> ${mountPoint ?? '?'}${writable ? ' (writable)' : ''}`;
}

export function assertOnlyRequestedMounts(
  filled: FilledMount[],
  requested: LimaMount[],
) {
  const filledWritable = filled.filter(mount => mount.writable);
  const requestedWritableCount = requested.filter(
    mount => mount.writable,
  ).length;
  const tooMany = filled.length > requested.length;
  if (!tooMany && filledWritable.length <= requestedWritableCount) return;

  const requestedLocations = new Set(
    requested.map(mount => hostPathKey(mount.location)),
  );
  const requestedMountPoints = new Set(
    requested.map(mount => mount.mountPoint),
  );
  const unrequested = filled.filter(
    mount =>
      !requestedLocations.has(hostPathKey(mount.location ?? '')) &&
      !requestedMountPoints.has(mount.mountPoint ?? undefined),
  );
  const fallback = tooMany ? filled : filledWritable;
  const suspects = unrequested.length > 0 ? unrequested : fallback;
  const limaConfigDir = path.join(
    process.env.LIMA_HOME ?? path.join(os.homedir(), '.lima'),
    '_config',
  );

  throw new Error(
    `refusing to continue: lima would give this VM host mounts or write access you did not ask for (requested ${requested.length} with ${requestedWritableCount} writable, lima resolved ${filled.length} with ${filledWritable.length} writable). unexpected: ${suspects.map(describeMount).join(', ')}. these usually come from ${path.join(limaConfigDir, 'default.yaml')} or ${path.join(limaConfigDir, 'override.yaml')}; remove the mounts from those files and try again.`,
  );
}
