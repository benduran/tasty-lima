import path from 'node:path';
import { build } from 'esbuild';

/**
 * CJS is a royal pain. why this module format cannot die yet is beyond me.
 */
const cjsShimBanner = `#!/usr/bin/env node
import { createRequire as __nodecCreateRequire } from 'node:module';
import { fileURLToPath as __nodecFileURLToPath } from 'node:url';
import { dirname as __nodecDirname } from 'node:path';

if (typeof globalThis.require !== 'function') {
  Object.defineProperty(globalThis, 'require', {
    configurable: true,
    enumerable: false,
    value: __nodecCreateRequire(import.meta.url),
    writable: true,
  });
}

if (typeof globalThis.__filename !== 'string') {
  const __nodecFilename = __nodecFileURLToPath(import.meta.url);
  Object.defineProperty(globalThis, '__filename', {
    configurable: true,
    enumerable: false,
    value: __nodecFilename,
    writable: true,
  });
  Object.defineProperty(globalThis, '__dirname', {
    configurable: true,
    enumerable: false,
    value: __nodecDirname(__nodecFilename),
    writable: true,
  });
}
`;

const entrypointPath = path.join(
  import.meta.dirname,
  '../src',
  'cli',
  'tasty-lima.ts',
);

await build({
  banner: { js: cjsShimBanner },
  bundle: true,
  entryPoints: [entrypointPath],
  format: 'esm',
  minify: true,
  outfile: path.join(import.meta.dirname, '../dist', 'tasty-lima.js'),
  platform: 'node',
  target: 'node24',
});
