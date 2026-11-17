import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import commandExists from 'command-exists';
import { $ } from 'execa';
import { z } from 'zod';
import { LIMA_VERSION } from '../../shared/constants.ts';
import { errorToString } from '../../shared/error-to-string.ts';
import { TASTY_LIMA_CACHE } from '../constants.ts';
import { logger } from '../logger.ts';
import { ensureQemu } from './ensureQemu.ts';
import { fileExists } from './util.ts';

const binaryFileName = `limactl${os.platform() === 'win32' ? '.exe' : ''}`;

const limaTag = `v${LIMA_VERSION}`;
const RELEASE_TAG_API_URL = `https://api.github.com/repos/lima-vm/lima/releases/tags/${limaTag}`;

// Lima publishes one archive per OS/arch, named `lima-<version>-<suffix>.<ext>`
const LIMA_TARGETS: Partial<
  Record<
    `${NodeJS.Platform}-${NodeJS.Architecture}`,
    {
      ext: 'tar.gz' | 'zip';
      suffix:
        | 'Darwin-arm64'
        | 'Darwin-x86_64'
        | 'Linux-aarch64'
        | 'Linux-x86_64'
        | 'Windows-ARM64'
        | 'Windows-AMD64';
    }
  >
> = {
  'darwin-arm64': { ext: 'tar.gz', suffix: 'Darwin-arm64' },
  'darwin-x64': { ext: 'tar.gz', suffix: 'Darwin-x86_64' },
  'linux-arm64': { ext: 'tar.gz', suffix: 'Linux-aarch64' },
  'linux-x64': { ext: 'tar.gz', suffix: 'Linux-x86_64' },
  'win32-arm64': { ext: 'zip', suffix: 'Windows-ARM64' },
  'win32-x64': { ext: 'zip', suffix: 'Windows-AMD64' },
};

const ReleaseAssetSchema = z.object({
  browser_download_url: z.url(),
  digest: z.string().nullish(),
  name: z.string(),
});
type LimaReleaseAsset = z.infer<typeof ReleaseAssetSchema>;

const ReleaseSchema = z.object({
  assets: z.array(ReleaseAssetSchema),
  draft: z.boolean(),
  prerelease: z.boolean(),
  tag_name: z.string(),
});
type LimaRelease = z.infer<typeof ReleaseSchema>;

function limaInstallDir(version: string): string {
  return path.join(TASTY_LIMA_CACHE, version);
}

let LIMA_BIN_PATH = '';

export function getLimaBinaryPath() {
  return LIMA_BIN_PATH || null;
}

function limaBinaryPath(installDir: string): string {
  if (LIMA_BIN_PATH) return LIMA_BIN_PATH;
  LIMA_BIN_PATH = path.join(installDir, 'bin', binaryFileName);
  return LIMA_BIN_PATH;
}

async function fetchPinnedLimaRelease(): Promise<LimaRelease> {
  const response = await fetch(RELEASE_TAG_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'tasty-lima',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 404) {
    throw new Error(
      `lima release ${limaTag} not found — check LIMA_VERSION in src/cli/constants.ts`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `GitHub releases API returned ${response.status} ${response.statusText} for ${RELEASE_TAG_API_URL} (unauthenticated callers are limited to 60 requests/hour)`,
    );
  }
  const release = ReleaseSchema.parse(await response.json());
  if (release.prerelease || release.draft) {
    throw new Error(
      `refusing to install non-stable lima release ${release.tag_name} (pinned via LIMA_VERSION)`,
    );
  }
  if (release.tag_name !== limaTag) {
    throw new Error(
      `expected lima release ${limaTag}, but the API returned ${release.tag_name}`,
    );
  }
  logger.info(`resolved pinned lima release ${release.tag_name}`);
  return release;
}

function pickAssetForHost(
  release: LimaRelease,
  version: string,
): { asset: LimaReleaseAsset; ext: string } {
  const host: keyof typeof LIMA_TARGETS = `${os.platform()}-${os.arch()}`;
  const target = LIMA_TARGETS[host];
  if (!target) {
    throw new Error(`lima does not publish a build for ${host}`);
  }
  const expectedName = `lima-${version}-${target.suffix}.${target.ext}`;
  const asset = release.assets.find(
    candidate => candidate.name === expectedName,
  );
  if (!asset) {
    throw new Error(`lima ${release.tag_name} has no ${expectedName} asset`);
  }
  return { asset, ext: target.ext };
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  // GitHub redirects asset downloads to objects.githubusercontent.com
  const response = await fetch(url, {
    headers: { 'User-Agent': 'tasty-lima' },
    redirect: 'follow',
    signal: AbortSignal.timeout(300_000),
  });
  if (!response.ok) {
    throw new Error(
      `download of ${url} failed with ${response.status} ${response.statusText}`,
    );
  }
  if (!response.body) {
    throw new Error(`download of ${url} returned an empty response body`);
  }
  await pipeline(
    (await response.blob()).stream(),
    // Readable.fromWeb(response.body as unknown as WebReadableStream<Uint8Array>),
    createWriteStream(destPath),
  );
  const { size } = await fs.stat(destPath);
  logger.info('download complete', {
    bytes: size,
    file: path.basename(destPath),
  });
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  await pipeline(createReadStream(filePath), hash);
  return hash.digest('hex');
}

async function fetchReleaseSha256Sums(
  url: string,
): Promise<Map<string, string>> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'tasty-lima' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(
      `download of ${url} failed with ${response.status} ${response.statusText}`,
    );
  }
  const sums = new Map<string, string>();
  for (const line of (await response.text()).split(/\r?\n/)) {
    const match = /^([a-f0-9]{64})\s+\*?(\S+)$/.exec(line.trim());
    if (!match?.[1] || !match[2]) continue;
    sums.set(match[2], match[1]);
  }
  return sums;
}

async function verifyArchiveChecksum(
  archivePath: string,
  asset: LimaReleaseAsset,
  sums: Map<string, string>,
): Promise<void> {
  const expected = sums.get(asset.name);
  if (!expected) {
    throw new Error(`${asset.name} is not listed in this release's SHA256SUMS`);
  }
  const actual = await sha256File(archivePath);
  if (actual !== expected) {
    throw new Error(
      `sha256 mismatch for ${asset.name}: SHA256SUMS says ${expected}, downloaded archive hashes to ${actual}`,
    );
  }
  // the GitHub API digest is an independent record of the same checksum
  // require the two sources to agree when both are available
  if (asset.digest?.startsWith('sha256:')) {
    const apiDigest = asset.digest.slice('sha256:'.length);
    if (apiDigest !== actual) {
      throw new Error(
        `sha256 mismatch for ${asset.name}: downloaded archive hashes to ${actual}, but the GitHub API says ${apiDigest}`,
      );
    }
  }
  logger.info(`verified ${asset.name} sha256 against the release SHA256SUMS`);
}

// rather than installing some node-specific archive tool, we leverage
// the system built-ins, where possible. if they don't exist,
// then I'm sorry for now
async function extractArchive(
  archivePath: string,
  installDir: string,
  archiveExtension: string,
): Promise<void> {
  if (archiveExtension !== 'zip') {
    await $({ cwd: installDir })`tar -xzf ${path.basename(archivePath)}`;
    return;
  }

  // bsdtar reads zips but is absent on older/minimal windows SKUs, so fall
  // back to powershell's Expand-Archive on any miss or failure
  const zip = path.basename(archivePath);
  const systemTar = path.join(
    process.env.SystemRoot ?? 'C:\\Windows',
    'System32',
    'tar.exe',
  );
  if (await fileExists(systemTar)) {
    try {
      await $({ cwd: installDir })`${systemTar} -xf ${zip}`;
      return;
    } catch {
      logger.warn(`${systemTar} failed to extract ${zip}; trying powershell`);
    }
  }
  // -Force cleans up after a partially-successful bsdtar run
  await $({
    cwd: installDir,
  })`powershell.exe -NoProfile -NonInteractive -Command ${`Expand-Archive -LiteralPath '${zip}' -DestinationPath '.' -Force`}`;
}

async function cleanupOldLimaVersions() {
  const dir = path.dirname(limaInstallDir(LIMA_VERSION));
  for (const folderOrFile of await fs.readdir(dir)) {
    // don't blast away the version we actually want if we already have it
    if (folderOrFile.endsWith(LIMA_VERSION)) continue;

    const fullPath = path.join(dir, folderOrFile);
    try {
      logger.info(`checking if we need to cleanup ${fullPath}`);
      const stat = await fs.stat(fullPath, { throwIfNoEntry: false });
      if (!stat?.isDirectory()) {
        throw new Error(`${fullPath} is not a folder`);
      }
      logger.info(`removing old lima versions at ${fullPath}`);
      await fs.rm(fullPath, { force: true, recursive: true });
    } catch (error) {
      logger.warn(`failed to cleanup ${fullPath}: ${errorToString(error)}`);
    }
  }
}

async function downloadLimaCtl(): Promise<string> {
  const installDir = limaInstallDir(LIMA_VERSION);
  const binary = limaBinaryPath(installDir);
  if (await fileExists(binary)) {
    logger.info('using cached limactl binary', {
      binary,
      version: LIMA_VERSION,
    });
    return binary;
  }

  logger.info(`no cached limactl ${LIMA_VERSION}, installing pinned release`);
  const release = await fetchPinnedLimaRelease();
  const { asset, ext } = pickAssetForHost(release, LIMA_VERSION);

  // the release's own SHA256SUMS is the authoritative checksum list
  const sumsAsset = release.assets.find(
    candidate => candidate.name === 'SHA256SUMS',
  );
  if (!sumsAsset) {
    throw new Error(
      `lima ${release.tag_name} publishes no SHA256SUMS to verify against`,
    );
  }

  await fs.mkdir(installDir, { recursive: true });
  const archivePath = path.join(installDir, asset.name);
  logger.info(`downloading ${asset.name} from GitHub releases`);
  try {
    const sha256Sums = await fetchReleaseSha256Sums(
      sumsAsset.browser_download_url,
    );
    await downloadFile(asset.browser_download_url, archivePath);
    await verifyArchiveChecksum(archivePath, asset, sha256Sums);
    await extractArchive(archivePath, installDir, ext);
    logger.info(`extracted ${asset.name}`, { installDir });
  } catch (error) {
    // leave no half-installed tree behind so the next attempt starts clean
    await fs.rm(installDir, { force: true, recursive: true });
    const installError =
      error instanceof Error
        ? new Error(`could not install lima ${LIMA_VERSION} to ${installDir}`, {
            cause: error,
          })
        : error;
    logger.error(
      installError instanceof Error
        ? installError.message
        : String(installError),
    );
    throw installError;
  }
  await fs.rm(archivePath, { force: true });

  // zips don't carry the exec bit (tar does), and chmod-ing the unix
  // binaries is harmless anyway
  const binDir = path.join(installDir, 'bin');
  for (const entry of await fs.readdir(binDir)) {
    await fs.chmod(path.join(binDir, entry), 0o755);
  }

  logger.info(`installed limactl ${LIMA_VERSION}`, { binary });
  return binary;
}

/**
 * parses output from `limactl --version` (which ends up being something like "limactl version 2.2.1")
 */
async function limaCtlVersion(binary: string): Promise<string | undefined> {
  try {
    const { stdout } = await $`${binary} --version`;
    return /version\s+v?(\S+)/.exec(stdout)?.[1];
  } catch (error) {
    logger.warn(
      `could not read the version of ${binary}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
}

export async function ensureLimaCtl(): Promise<string> {
  // limactl shells out to qemu on Windows, so it must be present and on PATH
  await ensureQemu();
  if (commandExists.sync(binaryFileName)) {
    const version = await limaCtlVersion(binaryFileName);
    if (version === LIMA_VERSION) {
      logger.info('using limactl from PATH, which matches the pinned version', {
        command: binaryFileName,
        version,
      });
      LIMA_BIN_PATH = binaryFileName;
      return binaryFileName;
    }
    logger.warn(
      `limactl on PATH is ${version ?? 'an unknown version'}, but tasty-lima is pinned to ${LIMA_VERSION}. using the pinned release managed by tasty-lima, instead`,
      { command: binaryFileName },
    );
  }
  await fs.mkdir(limaInstallDir(LIMA_VERSION), { recursive: true });
  await cleanupOldLimaVersions();
  return await downloadLimaCtl();
}
