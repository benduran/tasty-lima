import { parse, stringify } from 'yaml';
import { z } from 'zod';
import type { LimaYAMLInput } from './creator-types.ts';
import { LimaYAMLInputSchema } from './creator-types.ts';
import { errorToString } from './error-to-string.ts';
import type { LimaProvision } from './limactl-types.gen.ts';

export const BASH_SCRIPT_HEADER = '#!/bin/bash\nset -eux -o pipefail';

export const BOOT_SCRIPT_EXAMPLE =
  'systemctl disable NetworkManager-wait-online.service';
export const SYSTEM_SCRIPT_EXAMPLE =
  'command -v docker || apt-get install -y docker.io';

export const LimaTemplateSummarySchema = z.object({
  experimental: z.boolean(),
  name: z.string(),
});
export type LimaTemplateSummary = z.infer<typeof LimaTemplateSummarySchema>;

function normalizeProvision(entry: LimaProvision): LimaProvision {
  if (typeof entry.script !== 'string') return entry;
  return { ...entry, script: normalizeProvisionScript(entry) };
}

function normalizeProvisionScript(entry: LimaProvision): string {
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

/** Pulls the inline script form back out of provision entries parsed from yaml */
function configFromYamlParsed(config: LimaYAMLInput): LimaYAMLInput {
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

/**
 * A bidirectional codec for lima.yaml where the decoded form is a config object,
 * the encoded form is its yaml text
 */
export const LimaYAMLInputCodec = z.codec(
  z.string().nonempty().nonoptional(),
  LimaYAMLInputSchema,
  {
    // decode: yaml text -> lima config
    decode: (yaml, payload) => {
      let raw: unknown;
      try {
        raw = parse(yaml);
      } catch (error) {
        payload.issues.push({
          code: 'custom',
          input: yaml,
          message: errorToString(error),
          path: [],
        });
        return yaml as never;
      }
      const validated = LimaYAMLInputSchema.safeParse(raw);
      return validated.success
        ? configFromYamlParsed(validated.data)
        : (raw as never);
    },
    // encode: lima config -> yaml text
    encode: config => {
      const validated = LimaYAMLInputSchema.parse(config);
      const normalized = {
        ...validated,
        provision: validated.provision?.map(normalizeProvision),
      };
      return stringify(normalized, { lineWidth: 0 });
    },
  },
);
