import { execa } from 'execa';
import { z } from 'zod';
import { isObject } from '@/shared/util';
import { logger } from '../logger';
import { getLimaBinaryPath } from './ensureLimaCtl';
import type { LimaInstance } from './types.gen';
import { LimaInstanceSchema } from './types.gen';

async function limaExec(args: string[]) {
  const binPath = getLimaBinaryPath();
  if (!binPath) {
    throw new Error(
      `unable execute limactl because no limactl bin path was configured. this is a bug 🐛`,
    );
  }
  const result = await execa(binPath, args, { stdio: 'pipe' });
  if (result.exitCode && result.exitCode !== 0) {
    throw new Error(
      `limactl ${args.join(' ')} exited with code ${result.exitCode}: ${result.stderr}`,
    );
  }
  return result.stdout;
}

export async function listInstances(): Promise<LimaInstance[]> {
  const result = await limaExec(['ls', '--all-fields', '--json']);

  const out: LimaInstance[] = [];
  for (const line of result.split('\n')) {
    if (!line) continue;

    const raw = JSON.parse(line);
    const parsed = LimaInstanceSchema.safeParse(raw);
    if (!parsed.success) {
      const name = isObject(raw) && 'name' in raw ? raw.name : undefined;
      logger.warn(
        'skipping a lima instance because its parsed result does not match its types',
        {
          issues: z.prettifyError(parsed.error),
          name,
        },
      );
      continue;
    }
    out.push(parsed.data);
  }

  return out;
}
