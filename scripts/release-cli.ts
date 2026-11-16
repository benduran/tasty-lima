/* biome-ignore-all lint/suspicious/noConsole: a release script's output IS its interface */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execa } from 'execa';

const REPO_ROOT = path.join(import.meta.dirname, '..');
const DIST_DIR = path.join(REPO_ROOT, 'dist');

/** Must match the `tasty-lima-<target>` filenames nodec emits into ./dist */
const RELEASE_BINARIES = [
  'tasty-lima-linux-arm64',
  'tasty-lima-linux-arm64-musl',
  'tasty-lima-linux-x64',
  'tasty-lima-linux-x64-musl',
  'tasty-lima-macos-arm64',
  'tasty-lima-win-x64.exe',
] as const;

const CHECKSUMS_FILENAME = 'checksums.txt';

function die(message: string, error?: unknown): never {
  console.error(`✗ ${message}`);
  if (error) console.error(error);
  process.exit(1);
}

function semverOfTag(tag: string): string | null {
  const match = tag.match(/^tasty-lima@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
  return match?.[1] ?? null;
}

async function resolveReleaseTag(): Promise<{ tag: string; version: string }> {
  const { stdout } = await execa(
    'git',
    ['tag', '-l', 'tasty-lima@*', '--sort=-v:refname'],
    { cwd: REPO_ROOT },
  );
  const tag = stdout.split('\n')[0]?.trim() ?? '';
  const version = tag ? semverOfTag(tag) : null;
  if (!version) {
    die(
      'No tasty-lima@<SEMVER> tag found. Run lets-version first, then re-run this script.',
    );
  }
  return { tag, version };
}

async function assertTagMatchesPackageJson(version: string): Promise<void> {
  const pjson = JSON.parse(
    await fs.readFile(path.join(REPO_ROOT, 'package.json'), 'utf-8'),
  ) as { version?: string };
  if (pjson.version !== version) {
    die(
      `Version mismatch: latest tag says ${version} but package.json says ${pjson.version}. ` +
        'Was lets-version run without committing/bumping?',
    );
  }
}

async function assertTagIsPushed(tag: string): Promise<void> {
  // `gh release create` will happily create a NEW tag at the default branch's
  // head if the tag is missing on the remote. Guard against the local tag not
  // having been pushed yet.
  const [{ stdout: localSha }, { stdout: remoteRefs }] = await Promise.all([
    execa('git', ['rev-parse', `${tag}^{commit}`], { cwd: REPO_ROOT }),
    execa('git', ['ls-remote', 'origin', `refs/tags/${tag}`], {
      cwd: REPO_ROOT,
    }),
  ]);
  const remoteSha = remoteRefs.split('\t')[0]?.trim() ?? '';
  if (!remoteSha || remoteSha !== localSha.trim()) {
    die(
      `Tag ${tag} is missing on origin or points elsewhere. Push it first: git push origin ${tag}`,
    );
  }
}

async function buildAllTargets(): Promise<void> {
  console.log('Building all CLI targets (turbo runs them concurrently)...');
  await execa('pnpm', ['exec', 'turbo', 'run', 'build:cli:all'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
}

async function collectBinaries(): Promise<string[]> {
  const binaries: string[] = [];
  for (const filename of RELEASE_BINARIES) {
    const fp = path.join(DIST_DIR, filename);
    if (
      !(await fs.stat(fp).then(
        () => true,
        () => false,
      ))
    ) {
      die(`Expected release binary is missing after build: ${fp}`);
    }
    binaries.push(fp);
  }
  return binaries;
}

async function writeChecksums(binaries: string[]): Promise<string> {
  const lines: string[] = [];
  for (const fp of binaries) {
    const hash = createHash('sha256')
      .update(await fs.readFile(fp))
      .digest('hex');
    lines.push(`${hash}  ${path.basename(fp)}`);
  }
  const outPath = path.join(DIST_DIR, CHECKSUMS_FILENAME);
  await fs.writeFile(outPath, `${lines.join('\n')}\n`, 'utf-8');
  console.log(`Wrote ${outPath}:\n${lines.join('\n')}`);
  return outPath;
}

/** Extracts the CHANGELOG.md section for the given version (heading line excluded). */
async function releaseNotesFor(version: string): Promise<string> {
  const changelog = await fs.readFile(
    path.join(REPO_ROOT, 'CHANGELOG.md'),
    'utf-8',
  );
  const lines = changelog.split('\n');
  const start = lines.findIndex(l => l.startsWith(`## ${version} `));
  if (start === -1) return `Release tasty-lima@${version}`;
  const body: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) break;
    body.push(lines[i]);
  }
  return body.join('\n').trim() || `Release tasty-lima@${version}`;
}

async function publish(
  tag: string,
  version: string,
  assets: string[],
): Promise<void> {
  const notes = await releaseNotesFor(version);
  try {
    await execa(
      'gh',
      [
        'release',
        'create',
        tag,
        ...assets,
        '--title',
        `tasty-lima ${version}`,
        '--notes',
        notes,
        // lets-version prerelease tags (e.g. 0.0.2-alpha.2) become prereleases
        ...(/-/.test(version) ? ['--prerelease'] : []),
      ],
      { cwd: REPO_ROOT, stdio: 'inherit' },
    );
  } catch (error) {
    // Release (or one of its assets) already exists -> re-upload in place.
    const message = error instanceof Error ? error.message : String(error);
    if (!/already.?exist/i.test(message)) throw error;
    console.log(
      `Release ${tag} already exists; re-uploading assets with --clobber...`,
    );
    await execa('gh', ['release', 'upload', tag, ...assets, '--clobber'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
  }
}

async function main(): Promise<void> {
  const { tag, version } = await resolveReleaseTag();
  console.log(`Releasing ${tag} from the existing tag`);
  await assertTagMatchesPackageJson(version);
  await assertTagIsPushed(tag);
  await buildAllTargets();
  const binaries = await collectBinaries();
  const checksums = await writeChecksums(binaries);
  await publish(tag, version, [...binaries, checksums]);
  console.log(`✓ ${tag} published with ${binaries.length + 1} assets`);
}

main().catch(error => die('Release failed', error));
