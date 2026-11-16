import { promises as fs } from 'node:fs';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { execa } from 'execa';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import type { LimaTemplateSummary } from '../../shared/codecs.ts';
import { LimaYAMLInputCodec } from '../../shared/codecs.ts';
import type {
  CreateLimaVM,
  EditLimaVM,
  LimaInstance,
  LimaYAMLInput,
  LogLevel,
  LogLine,
  Nullish,
} from '../../shared/types.ts';
import { LimaFilenames, LimaInstanceSchema } from '../../shared/types.ts';
import {
  byteSizeToBytes,
  isNullOrUndefined,
  isObject,
  safeJsonParse,
} from '../../shared/util.ts';
import { TASTY_LIMA_TEMP } from '../constants.ts';
import { logger } from '../logger.ts';
import { getLimaBinaryPath } from './ensureLimaCtl.ts';
import { getQemuPathDirs } from './ensureQemuLinux.ts';

type LogLineSink = {
  end: () => void;
  note: (level: LogLevel, msg: string) => void;
  write: (chunk: Buffer) => void;
};

export type UnsequencedLogLine = Omit<LogLine, 'seq'>;

export type OnLogLines = (lines: UnsequencedLogLine[]) => void;

type LimaExecOpts = Partial<{
  sink: LogLineSink;
}>;

function limaChildEnv(): NodeJS.ProcessEnv {
  const qemuPathDirs = getQemuPathDirs();
  if (qemuPathDirs.length === 0) return {};
  return {
    PATH: [...qemuPathDirs, process.env.PATH ?? ''].join(path.delimiter),
  };
}

async function limaExec(args: string[], opts?: LimaExecOpts) {
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

  const sink = opts?.sink;
  const onChunk = sink ? (chunk: Buffer) => sink.write(chunk) : undefined;
  if (onChunk) {
    child.all.on('data', onChunk);
  }

  const result = await child;

  if (onChunk) {
    child.all.off('data', onChunk);
    sink?.end();
  }

  if (result.failed) {
    throw new Error(
      `limactl ${args.join(' ')} exited with code ${result.exitCode ?? 'unknown'}: ${limactlFailureReason(result.stderr)}`,
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
  return instances.find(instance => instance.name === name) ?? null;
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

async function copyConfigOnDisk(
  configFile: string,
  mode: '--embed-all' | '--fill',
) {
  return await limaExec(['tmpl', 'copy', mode, configFile, '-']);
}

async function resolveConfigOnDisk(
  configFile: string,
  original: LimaYAMLInput,
): Promise<string> {
  const resolved: LimaYAMLInput = {
    ...LimaYAMLInputCodec.decode(
      await copyConfigOnDisk(configFile, '--embed-all'),
    ),
    mounts: original.mounts ?? [],
  };
  const resolvedYaml = LimaYAMLInputCodec.encode(resolved);
  if (original.user?.home) return resolvedYaml;

  await fs.writeFile(configFile, resolvedYaml);
  const { mounts, user } = FilledHomeAndMountsSchema.parse(
    parseYaml(await copyConfigOnDisk(configFile, '--fill')),
  );
  const guestHome = user?.home;
  if (!guestHome || !mounts?.some(mount => mount.mountPoint === guestHome)) {
    return resolvedYaml;
  }

  const home = path.posix.join(
    path.posix.dirname(guestHome),
    ALTERNATE_GUEST_HOME_BASENAME,
  );
  logger.info('moving the guest home because a mount occupies it', {
    guestHome,
    home,
  });
  return LimaYAMLInputCodec.encode({
    ...resolved,
    user: { ...resolved.user, home },
  });
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

const LimactlJsonLineSchema = z.looseObject({
  level: z.string(),
  msg: z.string(),
  time: z.string().optional(),
});

function levelFromLimactlJson(level: string): LogLevel {
  switch (level) {
    case 'error':
    case 'fatal':
    case 'panic':
      return 'error';
    case 'warn':
    case 'warning':
      return 'warn';
    default:
      return 'info';
  }
}

type ParsedLimactlLine = {
  dedupeKey: string | undefined;
  level: LogLevel;
  msg: string;
  t: number;
};

function parseLimactlLine(raw: string): ParsedLimactlLine {
  const parsed = LimactlJsonLineSchema.safeParse(safeJsonParse(raw));
  if (!parsed.success) {
    return {
      dedupeKey: undefined,
      level: limactlLogLevel(raw),
      msg: raw,
      t: Date.now(),
    };
  }

  const { level, msg, time, ...fields } = parsed.data;
  const extras = Object.entries(fields).map(
    ([key, val]) =>
      `${key}=${typeof val === 'string' ? val : JSON.stringify(val)}`,
  );
  const fullMsg = extras.length > 0 ? `${msg} (${extras.join(', ')})` : msg;
  const parsedTime = time ? Date.parse(time) : Number.NaN;

  return {
    dedupeKey: `${time ?? ''}|${level}|${fullMsg}`,
    level: levelFromLimactlJson(level),
    msg: fullMsg,
    t: Number.isNaN(parsedTime) ? Date.now() : parsedTime,
  };
}

function limactlFailureReason(stderr: string) {
  const lines = stderr
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(parseLimactlLine);
  const lastError = lines.findLast(line => line.level === 'error');
  return (lastError ?? lines.at(-1))?.msg ?? 'no output';
}

function createLogLineSink(onLines?: OnLogLines): LogLineSink {
  const decoder = new StringDecoder('utf8');
  const seen = new Set<string>();
  let pending = '';

  const parseRaw = (raw: string): UnsequencedLogLine[] => {
    const line = raw.replace(/\r$/, '');
    if (!line.trim()) return [];
    const parsed = parseLimactlLine(line);
    if (!isNullOrUndefined(parsed.dedupeKey)) {
      if (seen.has(parsed.dedupeKey)) return [];
      seen.add(parsed.dedupeKey);
    }
    return [{ level: parsed.level, msg: parsed.msg, t: parsed.t }];
  };

  const emit = (lines: UnsequencedLogLine[]) => {
    if (lines.length > 0) onLines?.(lines);
  };

  const consume = (text: string) => {
    const rawLines = (pending + text).split('\n');
    pending = rawLines.pop() ?? '';
    emit(rawLines.flatMap(parseRaw));
  };

  return {
    end: () => {
      const rest = pending + decoder.end();
      pending = '';
      emit(rest.split('\n').flatMap(parseRaw));
    },
    note: (level, msg) => emit([{ level, msg, t: Date.now() }]),
    write: chunk => consume(decoder.write(chunk)),
  };
}

const HostAgentStatusSchema = z.looseObject({
  status: z
    .looseObject({
      degraded: z.boolean().optional(),
      errors: z.array(z.string()).nullish(),
      exiting: z.boolean().optional(),
      running: z.boolean().optional(),
    })
    .optional(),
});
type HostAgentStatus = NonNullable<
  z.infer<typeof HostAgentStatusSchema>['status']
>;

async function readHostAgentStatus(
  instanceDir: string,
): Promise<HostAgentStatus | undefined> {
  let contents: string;
  try {
    contents = await fs.readFile(
      path.join(instanceDir, LimaFilenames.HostAgentStdoutLog),
      'utf-8',
    );
  } catch {
    return undefined;
  }
  const lastEvent = contents
    .split('\n')
    .map(line => line.trim())
    .findLast(Boolean);
  if (!lastEvent) return undefined;
  return HostAgentStatusSchema.safeParse(safeJsonParse(lastEvent)).data?.status;
}

async function tolerateDegradedBoot(
  name: string,
  error: unknown,
  sink: LogLineSink,
) {
  const instance = await getInstanceByName(name);
  const status =
    instance?.status === 'Running'
      ? await readHostAgentStatus(instance.dir)
      : undefined;
  if (status?.running && status.degraded) {
    const reasons = status.errors?.join('; ');
    sink.note(
      'warn',
      `${name} is running, but booted in a degraded state${reasons ? `: ${reasons}` : ''}`,
    );
    return;
  }
  throw error;
}

async function withTempDir<T>(prefix: string, fn: (dir: string) => Promise<T>) {
  await fs.mkdir(TASTY_LIMA_TEMP, { recursive: true });
  const dir = await fs.mkdtemp(path.join(TASTY_LIMA_TEMP, prefix));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { force: true, recursive: true });
  }
}

export async function createInstance(
  opts: CreateLimaVM,
  onLines?: OnLogLines,
): Promise<LimaInstance> {
  return await withTempDir('create-vm-', async dir => {
    const configFile = path.join(dir, LimaFilenames.LimaYAML);
    await fs.writeFile(configFile, LimaYAMLInputCodec.encode(opts.config));

    const configYaml = await resolveConfigOnDisk(configFile, opts.config);
    await fs.writeFile(configFile, configYaml);

    logger.info(`creating lima instance ${opts.name}`, { configYaml });
    const args = [
      '--tty=false',
      '--log-format=json',
      opts.startAfterCreate ? 'start' : 'create',
      configFile,
      `--name=${opts.name}`,
    ];

    const sink = createLogLineSink(onLines);
    try {
      await limaExec(args, { sink });
    } catch (error) {
      if (opts.startAfterCreate) {
        await tolerateDegradedBoot(opts.name, error, sink);
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
  });
}

export async function bootInstance(name: string, onLines?: OnLogLines) {
  const sink = createLogLineSink(onLines);
  try {
    await limaExec(['--tty=false', '--log-format=json', 'start', name], {
      sink,
    });
  } catch (error) {
    await tolerateDegradedBoot(name, error, sink);
    return { degraded: true, name };
  }
  return { degraded: false, name };
}

export async function shutdownInstance(name: string, onLines?: OnLogLines) {
  await limaExec(['--tty=false', '--log-format=json', 'stop', name], {
    sink: createLogLineSink(onLines),
  });
  return name;
}

export async function readInstanceConfig(instanceDir: string) {
  return LimaYAMLInputCodec.decode(
    await fs.readFile(path.join(instanceDir, LimaFilenames.LimaYAML), 'utf-8'),
  );
}

export async function readInstanceYaml(name: string) {
  const instance = await getInstanceByName(name);
  if (!instance) {
    throw new Error(`unable to read "${name}" because it doesn't exist`);
  }

  return fs.readFile(path.join(instance.dir, LimaFilenames.LimaYAML), 'utf-8');
}

export async function editInstance(
  { config, name, startAfterEdit }: EditLimaVM,
  onLines?: OnLogLines,
) {
  const instance = await getInstanceByName(name);
  if (!instance) {
    throw new Error(`unable to edit "${name}" because it doesn't exist`);
  }

  const newDisk = byteSizeToBytes(config.disk);
  if (instance.disk && newDisk && newDisk < instance.disk) {
    throw new Error(
      `unable to edit "${name}": shrinking its disk (${instance.disk} bytes -> ${newDisk} bytes) is not supported`,
    );
  }

  await withTempDir('edit-vm-', async dir => {
    const configFile = path.join(dir, LimaFilenames.LimaYAML);
    await fs.writeFile(configFile, LimaYAMLInputCodec.encode(config));
    await fs.writeFile(
      configFile,
      await resolveConfigOnDisk(configFile, config),
    );

    await limaExec(
      ['--tty=false', '--log-format=json', 'tmpl', 'validate', configFile],
      { sink: createLogLineSink(onLines) },
    );

    if (instance.status === 'Running') {
      await shutdownInstance(name, onLines);
    }
    await fs.copyFile(
      configFile,
      path.join(instance.dir, LimaFilenames.LimaYAML),
    );
  });

  if (!startAfterEdit) return { degraded: false, name };
  return await bootInstance(name, onLines);
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
