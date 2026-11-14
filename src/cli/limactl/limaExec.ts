import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import type { LimaTemplateSummary } from '../../shared/codecs.ts';
import { LimaYAMLInputCodec } from '../../shared/codecs.ts';
import type {
  CreateLimaVM,
  LimaInstance,
  LimaYAMLInput,
  LogLine,
} from '../../shared/types.ts';
import { LimaInstanceSchema } from '../../shared/types.ts';
import { isObject } from '../../shared/util.ts';
import { TASTY_LIMA_TEMP } from '../constants.ts';
import { logger } from '../logger.ts';
import { getLimaBinaryPath } from './ensureLimaCtl.ts';
import { getQemuPathDirs } from './ensureQemuLinux.ts';

function limaChildEnv(): NodeJS.ProcessEnv {
  const qemuPathDirs = getQemuPathDirs();
  if (qemuPathDirs.length === 0) return {};
  return {
    PATH: [...qemuPathDirs, process.env.PATH ?? ''].join(path.delimiter),
  };
}

async function limaExec(
  args: string[],
  opts?: Partial<{
    onStderr: (chunk: unknown) => void;
    onStdout: (chunk: unknown) => void;
  }>,
) {
  const binPath = getLimaBinaryPath();
  if (!binPath) {
    throw new Error(
      `unable execute limactl because no limactl bin path was configured. this is a bug 🐛`,
    );
  }
  const child = execa(binPath, args, {
    env: limaChildEnv(),
    stdio: 'pipe',
  });

  if (opts?.onStderr) {
    child.stderr.on('data', opts.onStderr);
  }
  if (opts?.onStdout) {
    child.stdout.on('data', opts.onStdout);
  }

  const result = await child;

  if (opts?.onStderr) {
    child.stderr.off('data', opts.onStderr);
  }
  if (opts?.onStdout) {
    child.stdout.off('data', opts.onStdout);
  }

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

const ALTERNATE_GUEST_HOME_BASENAME = '{{.User}}.linux';

const FilledHomeAndMountsSchema = z.object({
  mounts: z.array(z.object({ mountPoint: z.string().nullish() })).nullish(),
  user: z.object({ home: z.string().nullish() }).nullish(),
});

async function withNonCollidingGuestHome(
  configFile: string,
  config: LimaYAMLInput,
): Promise<LimaYAMLInput> {
  if (config.user?.home) return config;

  const filled = FilledHomeAndMountsSchema.parse(
    parseYaml(await limaExec(['tmpl', 'copy', '--fill', configFile, '-'])),
  );
  const guestHome = filled.user?.home;
  if (!guestHome) return config;

  const collides = filled.mounts?.some(mount => mount.mountPoint === guestHome);
  if (!collides) return config;

  const home = path.posix.join(
    path.posix.dirname(guestHome),
    ALTERNATE_GUEST_HOME_BASENAME,
  );
  logger.info('moving the guest home because a mount occupies it', {
    guestHome,
    home,
  });
  return { ...config, user: { ...config.user, home } };
}

export async function createInstance(
  opts: CreateLimaVM,
  onLine?: (line: LogLine) => void,
): Promise<LimaInstance> {
  await fs.mkdir(TASTY_LIMA_TEMP, { recursive: true });
  const dir = await fs.mkdtemp(path.join(TASTY_LIMA_TEMP, 'create-vm-'));
  try {
    const configFile = path.join(dir, 'lima.yaml');
    await fs.writeFile(configFile, LimaYAMLInputCodec.encode(opts.config));

    const configYaml = LimaYAMLInputCodec.encode(
      await withNonCollidingGuestHome(configFile, opts.config),
    );
    await fs.writeFile(configFile, configYaml);

    logger.info(`creating lima instance ${opts.name}`, { configYaml });
    const args = [
      '--tty=false',
      opts.startAfterCreate ? 'start' : 'create',
      configFile,
      `--name=${opts.name}`,
    ];

    // biome-ignore lint/suspicious/noExplicitAny: chunks are typed as anys in the node typings
    const createHandleStdio = (which: 'stderr' | 'stdout') => (chunk: any) => {
      const line = Buffer.from(chunk).toString('utf-8');
      onLine?.({
        level: which === 'stderr' ? 'error' : 'info',
        msg: line,
        t: new Date(),
      });
    };
    await limaExec(args, {
      onStderr: createHandleStdio('stderr'),
      onStdout: createHandleStdio('stdout'),
    });

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

export async function deleteInstance(name: string) {
  await limaExec(['rm', name]);
  return name;
}
