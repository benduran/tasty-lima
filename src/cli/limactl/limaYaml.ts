import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { LimaYAMLInputCodec } from '../../shared/codecs.ts';
import type { LimaYAMLInput } from '../../shared/types.ts';
import { LimaFilenames } from '../../shared/types.ts';
import { logger } from '../logger.ts';
import {
  assertOnlyRequestedMounts,
  FilledMountSchema,
  guestHomeClearOfMounts,
  mountsForConfig,
} from './mounts.ts';

export type CopyConfigOnDisk = (
  configFile: string,
  mode: '--embed-all' | '--fill',
) => Promise<string>;

const FilledHomeAndMountsSchema = z.object({
  mounts: z.array(FilledMountSchema).nullish(),
  user: z.object({ home: z.string().nullish() }).nullish(),
});

export function instanceYamlPath(instanceDir: string) {
  return path.join(instanceDir, LimaFilenames.LimaYAML);
}

export async function readInstanceYamlFile(instanceDir: string) {
  return await fs.readFile(instanceYamlPath(instanceDir), 'utf-8');
}

export async function readInstanceConfig(instanceDir: string) {
  return LimaYAMLInputCodec.decode(await readInstanceYamlFile(instanceDir));
}

async function fillConfigOnDisk(
  configFile: string,
  configYaml: string,
  copyConfigOnDisk: CopyConfigOnDisk,
) {
  await fs.writeFile(configFile, configYaml);
  return FilledHomeAndMountsSchema.parse(
    parseYaml(await copyConfigOnDisk(configFile, '--fill')),
  );
}

async function resolveConfigOnDisk(
  configFile: string,
  original: LimaYAMLInput,
  copyConfigOnDisk: CopyConfigOnDisk,
): Promise<string> {
  const requestedMounts = original.mounts ?? [];
  const resolved: LimaYAMLInput = {
    ...LimaYAMLInputCodec.decode(
      await copyConfigOnDisk(configFile, '--embed-all'),
    ),
    mounts: mountsForConfig(requestedMounts),
  };
  const resolvedYaml = LimaYAMLInputCodec.encode(resolved);

  const filled = await fillConfigOnDisk(
    configFile,
    resolvedYaml,
    copyConfigOnDisk,
  );
  const filledMounts = filled.mounts ?? [];
  assertOnlyRequestedMounts(filledMounts, requestedMounts);

  const guestHome = filled.user?.home;
  const home =
    original.user?.home || !guestHome
      ? null
      : guestHomeClearOfMounts(guestHome, filledMounts);
  if (!home) return resolvedYaml;

  logger.info('moving the guest home because a mount occupies it', {
    guestHome,
    home,
  });
  const movedHomeYaml = LimaYAMLInputCodec.encode({
    ...resolved,
    user: { ...resolved.user, home },
  });
  const refilled = await fillConfigOnDisk(
    configFile,
    movedHomeYaml,
    copyConfigOnDisk,
  );
  assertOnlyRequestedMounts(refilled.mounts ?? [], requestedMounts);
  return movedHomeYaml;
}

export async function writeResolvedConfig(
  dir: string,
  config: LimaYAMLInput,
  copyConfigOnDisk: CopyConfigOnDisk,
) {
  const configFile = instanceYamlPath(dir);
  await fs.writeFile(configFile, LimaYAMLInputCodec.encode(config));

  const configYaml = await resolveConfigOnDisk(
    configFile,
    config,
    copyConfigOnDisk,
  );
  await fs.writeFile(configFile, configYaml);
  return { configFile, configYaml };
}
