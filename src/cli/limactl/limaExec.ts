import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import { z } from 'zod';
import { configToYaml } from '../../shared/lima-yaml.ts';
import type {
  CreateLimaVM,
  LimaInstance,
  LimaTemplateSummary,
} from '../../shared/types.ts';
import { LimaInstanceSchema } from '../../shared/types.ts';
import { isObject } from '../../shared/util.ts';
import { TASTY_LIMA_TEMP } from '../constants.ts';
import { logger } from '../logger.ts';
import { getLimaBinaryPath } from './ensureLimaCtl.ts';

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

export async function listTemplates(): Promise<LimaTemplateSummary[]> {
  const result = await limaExec(['create', '--list-templates']);
  const names = result
    .split('\n')
    .map(line => path.basename(line.trim()))
    .filter(Boolean);

  return names.map(name => ({
    experimental: name.startsWith('experimental/'),
    name,
  }));
}

export async function createInstance(
  opts: CreateLimaVM,
): Promise<LimaInstance> {
  const configYaml = configToYaml(opts.config);
  const dir = await fs.mkdtemp(path.join(TASTY_LIMA_TEMP, 'create-vm'));
  try {
    const configFile = path.join(dir, 'lima.yaml');
    await fs.writeFile(configFile, configYaml);

    logger.info(`creating lima instance ${opts.name}`);
    if (opts.startAfterCreate) {
      await limaExec([
        '--tty=false',
        'start',
        configFile,
        `--name=${opts.name}`,
      ]);
    } else {
      await limaExec([
        '--tty=false',
        'create',
        configFile,
        `--name=${opts.name}`,
      ]);
    }

    const created = (await listInstances()).find(
      instance => instance.name === opts.name,
    );
    if (!created) {
      throw new Error(
        `limactl reported success, but the instance ${opts.name} is not in its output`,
      );
    }
    return created;
  } finally {
    await fs.rm(dir, { force: true, recursive: true });
  }
}
