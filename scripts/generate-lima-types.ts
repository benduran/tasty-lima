/**
 * Regenerates src/cli/limactl/types.gen.ts from lima's Go source at the tag
 * pinned by LIMA_VERSION. Run `pnpm gen:lima-types` after bumping it.
 *
 * scripts/lima-types (Go) type-checks lima's source and describes the JSON
 * that `limactl list --json` writes (this script turns that into zod schemas for the node-based CLI)
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { $ } from 'execa';
import { LIMA_VERSION } from '../src/shared/constants.ts';
import { isNullOrUndefined } from '../src/shared/util.ts';

const LIMA_MODULE = 'github.com/lima-vm/lima/v2';
const repoRoot = path.resolve(import.meta.dirname, '..');
const goDir = path.join(repoRoot, 'scripts', 'lima-types');
const outFile = path.join(repoRoot, 'src', 'shared', 'limactl-types.gen.ts');

// mirrors the output types in scripts/lima-types/main.go
type LimaTypes = {
  defs: Def[];
  enums: Enum[];
  filenames: Constant[];
  networkModes: Constant[];
  version: string;
};
type Constant = { name: string; value: string };
type Enum = { doc?: string; name: string; open?: boolean; values: string[] };
type Def = { fields: Field[]; name: string };
type Field = {
  deprecated?: boolean;
  doc?: string;
  name: string;
  optional?: boolean;
  type: Node;
};
type Node = {
  allowZero?: boolean;
  fields?: Field[];
  items?: Node;
  key?: Node;
  kind:
    | 'array'
    | 'boolean'
    | 'enum'
    | 'int'
    | 'int32'
    | 'number'
    | 'object'
    | 'record'
    | 'ref'
    | 'string'
    | 'tuple'
    | 'uint'
    | 'uint32'
    | 'unknown';
  loose?: boolean;
  nullable?: boolean;
  ref?: string;
  tuple?: Node[];
};

const MAX_LINE = 80;

function log(message: string) {
  process.stdout.write(`${message}\n`);
}

function must<T>(value: T | undefined, what: string): T {
  if (isNullOrUndefined(value)) {
    throw new Error(`scripts/lima-types output is missing ${what}`);
  }
  return value;
}

// LimaYAML keeps its name; everything else gets a Lima prefix
function typeName(goName: string) {
  return goName.startsWith('Lima') ? goName : `Lima${goName}`;
}

function schemaName(goName: string) {
  return `${typeName(goName)}Schema`;
}

function quote(value: string) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function propertyKey(name: string) {
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : quote(name);
}

function jsDoc(lines: string[], indent: string) {
  const safe = lines.map(line => line.replaceAll('*/', '*\\/'));
  if (safe.length === 0) return '';
  if (safe.length === 1) return `${indent}/** ${safe.join('')} */\n`;
  const body = safe.map(line => `${indent} *${line ? ` ${line}` : ''}`);
  return `${indent}/**\n${body.join('\n')}\n${indent} */\n`;
}

// lima marks deprecations in plain comments and `lima:"deprecated"` tags;
// turning them into @deprecated gets editors to strike the field through
function fieldDoc(field: Field) {
  const lines = (field.doc?.split('\n') ?? [])
    .filter(line => line !== 'DEPRECATED')
    .map(line => line.replace(/^Deprecated: /, '@deprecated '));
  if (field.deprecated && !lines.some(line => line.startsWith('@deprecated'))) {
    lines.push('@deprecated');
  }
  return lines;
}

// `z.enum([...])` on one line when it fits, one value per line otherwise
function list(prefix: string, items: string[], suffix: string) {
  const oneLine = `${prefix}${items.join(', ')}${suffix}`;
  if (oneLine.length <= MAX_LINE) return oneLine;
  return `${prefix}\n${items.map(item => `  ${item},\n`).join('')}${suffix}`;
}

class Renderer {
  private readonly enums: Map<string, Enum>;

  constructor(enums: Enum[]) {
    this.enums = new Map(enums.map(e => [e.name, e]));
  }

  private enumFor(node: Node) {
    const name = must(node.ref, `the name of a ${node.kind}`);
    return must(this.enums.get(name), `enum ${name}`);
  }

  enum(e: Enum) {
    const name = schemaName(e.name);
    const values = e.values.map(quote);
    if (!e.open) {
      return [
        list(`export const ${name} = z.enum([`, values, ']);'),
        `export type ${typeName(e.name)} = z.infer<typeof ${name}>;`,
      ].join('\n');
    }
    // the known values still autocomplete, but any other string parses
    const valuesName = `${typeName(e.name)}Values`;
    return [
      list(`export const ${valuesName} = [`, values, '] as const;'),
      jsDoc(
        [
          `One of {@link ${valuesName}}, or any other string: ${e.doc ?? 'lima does not list them all'}.`,
        ],
        '',
      ) +
        `export const ${name} = z.string() as z.ZodType<\n  (typeof ${valuesName})[number] | (string & {})\n>;`,
      `export type ${typeName(e.name)} = z.infer<typeof ${name}>;`,
    ].join('\n');
  }

  def(def: Def, doc: string[]) {
    const name = schemaName(def.name);
    return [
      `${jsDoc(doc, '')}export const ${name} = z.object(${this.shape(def.fields, '')});`,
      `export type ${typeName(def.name)} = z.infer<typeof ${name}>;`,
    ].join('\n');
  }

  private shape(fields: Field[], indent: string) {
    if (fields.length === 0) return '{}';
    const inner = `${indent}  `;
    return `{\n${fields.map(field => this.field(field, inner)).join('')}${indent}}`;
  }

  private field(field: Field, indent: string) {
    let schema = this.schema(field.type, indent);
    if (field.optional && field.type.nullable) schema += '.nullish()';
    else if (field.type.nullable) schema += '.nullable()';
    else if (field.optional) schema += '.optional()';
    return `${jsDoc(fieldDoc(field), indent)}${indent}${propertyKey(field.name)}: ${schema},\n`;
  }

  private node(node: Node, indent: string) {
    const schema = this.schema(node, indent);
    return node.nullable ? `${schema}.nullable()` : schema;
  }

  // the schema for a node, minus its nullability
  private schema(node: Node, indent: string): string {
    switch (node.kind) {
      case 'boolean':
        return 'z.boolean()';
      case 'string':
        return 'z.string()';
      case 'int':
        return 'z.int()';
      case 'int32':
        return 'z.int32()';
      case 'uint':
        return 'z.int().nonnegative()';
      case 'uint32':
        return 'z.uint32()';
      case 'number':
        return 'z.number()';
      case 'unknown':
        return 'z.unknown()';
      case 'ref':
        return schemaName(must(node.ref, 'the name of a ref'));
      case 'enum': {
        const e = this.enumFor(node);
        // a Go string field holds "" until it's set, e.g. on a broken instance
        if (node.allowZero && !e.open && !e.values.includes('')) {
          return `z.union([${schemaName(e.name)}, z.literal('')])`;
        }
        return schemaName(e.name);
      }
      case 'array':
        return `z.array(${this.node(must(node.items, 'array items'), indent)})`;
      case 'tuple':
        return `z.tuple([${(node.tuple ?? []).map(item => this.node(item, indent)).join(', ')}])`;
      case 'record': {
        const key = must(node.key, 'record keys');
        const value = this.node(must(node.items, 'record values'), indent);
        // z.record with an enum key demands every key, but lima's maps only
        // have some of them
        if (key.kind === 'enum' && !this.enumFor(key).open) {
          return `z.partialRecord(${schemaName(this.enumFor(key).name)}, ${value})`;
        }
        return `z.record(z.string(), ${value})`;
      }
      case 'object':
        return `${node.loose ? 'z.looseObject' : 'z.object'}(${this.shape(node.fields ?? [], indent)})`;
    }
  }
}

function render(types: LimaTypes) {
  const renderer = new Renderer(types.enums);
  const root = must(types.defs.at(-1), 'the root def');
  return [
    `// Code generated by scripts/generate-lima-types.ts from ${LIMA_MODULE}@${types.version}. DO NOT EDIT.`,
    '// To update, bump LIMA_VERSION in src/cli/constants.ts and run `pnpm gen:lima-types`.',
    '',
    "import { z } from 'zod';",
    "import type { LIMA_VERSION } from './constants.ts';",
    '',
    `export const LIMA_TYPES_VERSION = ${quote(types.version.replace(/^v/, ''))} as const;`,
    '',
    '// fails type-checking once LIMA_VERSION moves on without regenerating',
    'LIMA_TYPES_VERSION satisfies typeof LIMA_VERSION;',
    '',
    ...types.enums.map(e => `${renderer.enum(e)}\n`),
    ...types.defs.map(def =>
      def === root
        ? `${renderer.def(def, ['One line of `limactl list --json` output.'])}\n`
        : `${renderer.def(def, [])}\n`,
    ),
    'export const LimaFilenames = {',
    ...types.filenames.map(({ name, value }) => `  ${name}: ${quote(value)},`),
    '} as const;',
    '',
    'export const LimaNetworkModes = {',
    ...types.networkModes.map(
      ({ name, value }) => `  ${name}: ${quote(value)},`,
    ),
    '} as const;',
    '',
  ].join('\n');
}

async function main() {
  const tag = `v${LIMA_VERSION}`;
  const limaAtTag = `${LIMA_MODULE}@${tag}`;
  const go = $({ cwd: goDir, stderr: 'inherit' });

  log(`pinning scripts/lima-types to ${limaAtTag}`);
  await go`go get ${limaAtTag}`;
  await go`go mod tidy`;

  log(`reading lima ${tag} source`);
  const { stdout } = await go`go run . ${tag}`;
  const types = JSON.parse(stdout) as LimaTypes;

  await writeFile(outFile, render(types));
  log(`wrote ${path.relative(repoRoot, outFile)}`);
}

await main();
