import { parse, stringify } from 'yaml';
import { z } from 'zod';
import { errorToString } from './error-to-string.ts';
import type { LimaProvision, LimaYAMLInput } from './types.ts';
import { LimaYAMLInputSchema } from './types.ts';

export const BASH_SCRIPT_HEADER = '#!/bin/bash\nset -eux -o pipefail';

export const BOOT_SCRIPT_EXAMPLE =
  'systemctl disable NetworkManager-wait-online.service';
export const SYSTEM_SCRIPT_EXAMPLE =
  'command -v docker || apt-get install -y docker.io';

export type LimaYamlParseResult =
  | { config: LimaYAMLInput; ok: true }
  | { error: string; ok: false };

export function parseLimaYamlInput(text: string): LimaYamlParseResult {
  let raw: unknown;
  try {
    raw = parse(text);
  } catch (error) {
    return { error: errorToString(error), ok: false };
  }

  const validated = LimaYAMLInputSchema.safeParse(raw);
  if (!validated.success) {
    return { error: z.prettifyError(validated.error), ok: false };
  }

  return { config: validated.data, ok: true };
}

export function configToYaml(config: LimaYAMLInput): string {
  const normalized = LimaYAMLInputSchema.parse({
    ...config,
    provision: config.provision?.map(normalizeProvision),
  } satisfies LimaYAMLInput);
  return stringify(normalized, { lineWidth: 0 });
}

export function normalizeProvision(entry: LimaProvision): LimaProvision {
  if (typeof entry.script !== 'string') return entry;
  return { ...entry, script: normalizeProvisionScript(entry) };
}

export function normalizeProvisionScript(entry: LimaProvision): string {
  const script = entry.script;
  if (typeof script !== 'string') return '';

  const lf = script.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  if (entry.mode === 'boot') {
    return stripProvisionHeaders(lf);
  }

  const cleanFromHeaders = stripProvisionHeaders(lf);
  if (
    /^#!/.test(cleanFromHeaders) ||
    /set\s+-e|set\s+-o\s+pipefail/.test(cleanFromHeaders)
  ) {
    return cleanFromHeaders;
  }
  return `${BASH_SCRIPT_HEADER}\n${cleanFromHeaders}`;
}

function stripProvisionHeaders(script: string): string {
  const lines = script.split('\n');
  if (lines[0]?.startsWith('#!')) lines.shift();
  while (lines.length > 1 && lines[0]?.trim() === '') lines.shift();
  return lines.join('\n');
}

export function configFromYamlParsed(config: LimaYAMLInput): LimaYAMLInput {
  return {
    ...config,
    provision: config.provision?.map(entry => {
      if (typeof entry.script !== 'string' || entry.mode === 'boot') {
        return entry;
      }
      if (entry.script.startsWith(`${BASH_SCRIPT_HEADER}\n`)) {
        return {
          ...entry,
          script: entry.script.slice(BASH_SCRIPT_HEADER.length + 1),
        };
      }
      return entry;
    }),
  };
}
