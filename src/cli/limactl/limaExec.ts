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
  LogLevel,
  LogLine,
  Nullish,
} from '../../shared/types.ts';
import { LimaInstanceSchema } from '../../shared/types.ts';
import { isObject } from '../../shared/util.ts';
import { TASTY_LIMA_TEMP } from '../constants.ts';
import { logger } from '../logger.ts';
import { getLimaBinaryPath } from './ensureLimaCtl.ts';
import { getQemuPathDirs } from './ensureQemuLinux.ts';

type OnChunkOpts = Partial<{
  onChunk: (chunk: Buffer) => void;
}>;

function limaChildEnv(): NodeJS.ProcessEnv {
  const qemuPathDirs = getQemuPathDirs();
  if (qemuPathDirs.length === 0) return {};
  return {
    PATH: [...qemuPathDirs, process.env.PATH ?? ''].join(path.delimiter),
  };
}

async function limaExec(args: string[], opts?: OnChunkOpts) {
  const binPath = getLimaBinaryPath();
  if (!binPath) {
    throw new Error(
      `unable execute limactl because no limactl bin path was configured. this is a bug 🐛`,
    );
  }
  const child = execa(binPath, args, {
    all: true,
    env: limaChildEnv(),
    reject: false,
    stdio: 'pipe',
  });

  if (opts?.onChunk) {
    child.all.on('data', opts.onChunk);
  }

  const result = await child;

  if (opts?.onChunk) {
    child.all.off('data', opts.onChunk);
  }

  if (result.failed) {
    throw new Error(
      `limactl ${args.join(' ')} exited with code ${result.exitCode ?? 'unknown'}: ${result.stderr}`,
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

export async function getInstanceByName(
  name: string,
): Promise<Nullish<LimaInstance>> {
  const instances = await listInstances();
  return instances.find(instance => instance.name === name);
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

/**
 * limactl writes all of its logs to stderr via logrus, in either its bracket
 * form (`INFO[0000] …`) or its key=value form (`level=info …`) depending on
 * the terminal. stdout only carries non-log output.
 */
function limactlLogLevel(line: string): LogLevel {
  const bracket = /^\s*(DEBU|INFO|WARN|ERRO|FATA)\[/.exec(line)?.[1];
  const keyed = /\blevel=(error|fatal|warning|info|debug|trace)\b/.exec(
    line,
  )?.[1];
  switch (bracket ?? keyed) {
    case 'ERRO':
    case 'error':
    case 'FATA':
    case 'fatal':
      return 'error';
    case 'WARN':
    case 'warning':
      return 'warn';
    default:
      return 'info';
  }
}

/** one interleaved chunk from limactl: split it into lines and stream each */
function createHandleChunk(onLine?: (line: LogLine) => void) {
  return (chunk: Buffer) => {
    for (const msg of chunk.toString('utf-8').split('\n')) {
      if (!msg) continue;
      onLine?.({
        level: limactlLogLevel(msg),
        msg,
        t: Date.now(),
      });
    }
  };
}

/**
 * limactl exits non-zero when a boot ends up "degraded" (e.g. a boot script
 * failed) even though the VM itself came up. Only surface the failure when
 * the instance did not actually start; the degraded detail is already in the
 * streamed log lines.
 */
async function tolerateDegradedBoot(
  name: string,
  error: unknown,
  onLine?: (line: LogLine) => void,
) {
  const instance = await getInstanceByName(name);
  if (instance?.status === 'Running') {
    onLine?.({
      level: 'warn',
      msg: `limactl reported a degraded boot, but the instance is running`,
      t: Date.now(),
    });
    return;
  }
  throw error;
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

    try {
      await limaExec(args, { onChunk: createHandleChunk(onLine) });
    } catch (error) {
      if (opts.startAfterCreate) {
        await tolerateDegradedBoot(opts.name, error, onLine);
      } else {
        throw error;
      }
    }

    const created = await getInstanceByName(opts.name);
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

export async function bootInstance(
  name: string,
  onLine?: (line: LogLine) => void,
) {
  try {
    await limaExec(['--tty=false', 'start', name], {
      onChunk: createHandleChunk(onLine),
    });
  } catch (error) {
    await tolerateDegradedBoot(name, error, onLine);
  }
  return name;
}

export async function shutdownInstance(
  name: string,
  onLine?: (line: LogLine) => void,
) {
  await limaExec(['stop', name], { onChunk: createHandleChunk(onLine) });
  return name;
}

export async function deleteInstance(name: string) {
  const instance = await getInstanceByName(name);
  if (!instance) {
    throw new Error(`unable to delete "${name}" because it doesn't exist`);
  }
  if (instance.status === 'Running') {
    await shutdownInstance(name);
  }

  await limaExec(['rm', name]);
  return name;
}
