import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import commandExists from 'command-exists';
import { $ } from 'execa';
import { TASTY_LIMA_CACHE } from '../constants.ts';
import { logger } from '../logger.ts';
import { ensureQemuLinux } from './ensureQemuLinux.ts';
import { fileExists } from './util.ts';

const qemuBinaryFileName = 'qemu-system-x86_64.exe';

// QEMU publishes no Windows binaries on GitHub Releases; qemu.org's download
// page points at Stefan Weil's builds at https://qemu.weilnetz.de/w64/, whose
// index lists the newest `qemu-w64-setup-<YYYYMMDD>.exe` NSIS installer plus
// a matching `.sha512` (the same pair Chocolatey's qemu package consumes).
const QEMU_WINDOWS_INDEX_URL = 'https://qemu.weilnetz.de/w64/' as const;

function qemuWindowsInstallDirs(): string[] {
  return [
    path.win32.join('C:', 'Program Files', 'qemu'),
    path.win32.join(TASTY_LIMA_CACHE, 'qemu'),
  ];
}

type QemuWindowsBuild = {
  fileName: string;
  sha512Url: string;
  url: string;
};

async function fetchWithLongTimeout(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'tasty-lima' },
    signal: AbortSignal.timeout(15 * 60_000),
  });
  if (!response.ok) {
    throw new Error(
      `download of ${url} failed with ${response.status} ${response.statusText}`,
    );
  }
  return response;
}

// The index lists current builds at the top level; pick the newest by the
// YYYYMMDD embedded in the file name (lexicographic order == chronological).
async function findLatestQemuWindowsBuild(): Promise<QemuWindowsBuild> {
  const response = await fetch(QEMU_WINDOWS_INDEX_URL, {
    headers: { 'User-Agent': 'tasty-lima' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(
      `QEMU windows index at ${QEMU_WINDOWS_INDEX_URL} returned ${response.status} ${response.statusText}`,
    );
  }
  const index = await response.text();
  const buildDates: string[] = [];
  for (const match of index.matchAll(/qemu-w64-setup-(\d{8})\.exe/g)) {
    const date = match[1];
    if (date && !buildDates.includes(date)) {
      buildDates.push(date);
    }
  }
  if (buildDates.length === 0) {
    throw new Error(
      `no qemu-w64-setup-*.exe builds found at ${QEMU_WINDOWS_INDEX_URL}`,
    );
  }
  const latest = buildDates.reduce((a, b) => (a > b ? a : b));
  const fileName = `qemu-w64-setup-${latest}.exe`;
  return {
    fileName,
    // note: the checksum file drops the `.exe` (e.g. qemu-w64-setup-20260811.sha512)
    sha512Url: `${QEMU_WINDOWS_INDEX_URL}${fileName.replace(/\.exe$/, '')}.sha512`,
    url: `${QEMU_WINDOWS_INDEX_URL}${fileName}`,
  };
}

async function sha512File(filePath: string): Promise<string> {
  const hash = createHash('sha512');
  await pipeline(createReadStream(filePath), hash);
  return hash.digest('hex');
}

async function downloadQemuInstaller(build: QemuWindowsBuild): Promise<string> {
  logger.info('downloading QEMU installer', { url: build.url });
  await fs.mkdir(TASTY_LIMA_CACHE, { recursive: true });
  const installerPath = path.win32.join(TASTY_LIMA_CACHE, build.fileName);
  const response = await fetchWithLongTimeout(build.url);
  await pipeline(
    (await response.blob()).stream(),
    createWriteStream(installerPath),
  );

  // the site publishes `<installer>.sha512` beside each installer
  const sumResponse = await fetch(build.sha512Url, {
    headers: { 'User-Agent': 'tasty-lima' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!sumResponse.ok) {
    throw new Error(
      `fetching ${build.sha512Url} failed with ${sumResponse.status} ${sumResponse.statusText}`,
    );
  }
  const expected = /^([a-f0-9]{128})/i
    .exec((await sumResponse.text()).trim())?.[1]
    ?.toLowerCase();
  if (!expected) {
    throw new Error(
      `could not parse a sha512 checksum out of ${build.sha512Url}`,
    );
  }
  const actual = await sha512File(installerPath);
  if (actual !== expected) {
    throw new Error(
      `sha512 mismatch for ${build.fileName}: published sum says ${expected}, downloaded installer hashes to ${actual}`,
    );
  }
  logger.info(`verified ${build.fileName} against its published .sha512`);
  return installerPath;
}

async function runInstallerSilently(installerPath: string): Promise<void> {
  logger.info('running the QEMU installer silently (a UAC prompt may appear)', {
    installerPath,
  });
  // /S is the NSIS silent flag; the installer's default dir is used
  await $({ timeout: 10 * 60_000 })`${installerPath} /S`;
}

async function findQemuInstallDir(): Promise<string | undefined> {
  for (const dir of qemuWindowsInstallDirs()) {
    if (await fileExists(path.win32.join(dir, qemuBinaryFileName))) {
      return dir;
    }
  }
  return undefined;
}

function prependToPath(dir: string): void {
  // biome-ignore lint/style/noProcessEnv: PATH is the contract between tasty-lima and limactl
  const currentPath = process.env.PATH ?? '';
  if (currentPath.split(path.win32.delimiter).includes(dir)) {
    return;
  }
  // biome-ignore lint/style/noProcessEnv: PATH is the contract between tasty-lima and limactl
  process.env.PATH = `${dir}${path.win32.delimiter}${currentPath}`;
}

/**
 * Ensures QEMU — a hard limactl dependency on Windows — is available and on
 * PATH for anything this process spawns. No-op on other platforms, where lima
 * ships its own hypervisor drivers (vz/apple vz, qemu from the distro, ...).
 * Returns the QEMU dir if tasty-lima had to discover/install it onto PATH.
 */
export async function ensureQemu(): Promise<string | undefined> {
  if (os.platform() === 'linux') {
    await ensureQemuLinux();
    return undefined;
  }
  if (os.platform() !== 'win32') {
    // lima ships native hypervisor drivers elsewhere (macOS: apple vz / qemu
    // from the distro), so nothing to do.
    return undefined;
  }
  if (os.arch() !== 'x64') {
    throw new Error(
      `tasty-lima only supports x64 Windows (qemu.weilnetz.de has no windows-arm64 builds); found arch ${os.arch()}`,
    );
  }
  if (commandExists.sync(qemuBinaryFileName)) {
    logger.info('qemu is already available on PATH');
    return undefined;
  }
  const existingDir = await findQemuInstallDir();
  if (existingDir) {
    prependToPath(existingDir);
    logger.info('found QEMU on disk and added it to PATH', {
      dir: existingDir,
    });
    return existingDir;
  }

  logger.info('QEMU not found, installing the latest Windows build');
  const build = await findLatestQemuWindowsBuild();
  const installerPath = await downloadQemuInstaller(build);
  try {
    await runInstallerSilently(installerPath);
  } finally {
    await fs.rm(installerPath, { force: true });
  }
  const freshDir = await findQemuInstallDir();
  if (!freshDir) {
    throw new Error(
      `installed ${build.fileName} but could not find ${qemuBinaryFileName} in ${qemuWindowsInstallDirs().join(', ')}`,
    );
  }
  prependToPath(freshDir);
  logger.info('installed QEMU and added it to PATH', { dir: freshDir });
  return freshDir;
}
