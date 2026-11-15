import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { execa } from 'execa';
import { errorToString } from '../../shared/error-to-string.ts';
import { isNullOrUndefined } from '../../shared/util.ts';
import { TASTY_LIMA_CACHE } from '../constants.ts';
import { logger } from '../logger.ts';
import { fileExists } from './util.ts';

/**
 * QEMU's names for the host architectures tasty-lima provisions, which are
 * also the suffixes of the `qemu-system-*` binaries and `edk2-*-code.fd` firmware.
 * @see https://github.com/lima-vm/lima/blob/v2.3.0/pkg/driver/qemu/qemu.go#L1243-L1267
 */
type QemuArch = 'aarch64' | 'x86_64';

/**
 * tasty-lima's own grouping of distros that share a package manager and QEMU
 * package names. This is not an upstream taxonomy; each member is derived from
 * the `ID` / `ID_LIKE` fields of os-release, mapped in
 * {@link DISTRO_FAMILY_BY_OS_RELEASE_ID}.
 * @see https://www.freedesktop.org/software/systemd/man/latest/os-release.html
 */
type LinuxDistroFamily =
  | 'alpine'
  | 'arch'
  | 'debian'
  | 'fedora'
  | 'gentoo'
  | 'nixos'
  | 'rhel'
  | 'suse'
  | 'void';

type QemuInstallPlan = {
  packageManager: string;
  packages: Record<QemuArch, string[]>;
  steps: (packages: string[]) => string[][];
};

/**
 * Maps Node's `os.arch()` values to {@link QemuArch}.
 * @see https://nodejs.org/api/os.html#osarch
 */
const QEMU_ARCHES: Partial<Record<NodeJS.Architecture, QemuArch>> = {
  arm64: 'aarch64',
  x64: 'x86_64',
};

/**
 * Maps os-release `ID` values (and the tokens of `ID_LIKE`) to a
 * {@link LinuxDistroFamily}. `ID` is checked before `ID_LIKE`, so derivatives
 * such as Linux Mint (`ID_LIKE=debian`) or Rocky (`ID_LIKE="rhel centos fedora"`)
 * resolve through their parent when their own `ID` is not listed.
 *
 * Every key was checked against the real os-release files collected in
 * which-distro/os-release (`opensuse` and `suse` appear only as `ID_LIKE` tokens).
 * @see https://www.freedesktop.org/software/systemd/man/latest/os-release.html
 * @see https://github.com/which-distro/os-release
 */
const DISTRO_FAMILY_BY_OS_RELEASE_ID: Record<string, LinuxDistroFamily> = {
  almalinux: 'rhel',
  alpine: 'alpine',
  amzn: 'rhel',
  arch: 'arch',
  centos: 'rhel',
  debian: 'debian',
  endeavouros: 'arch',
  fedora: 'fedora',
  gentoo: 'gentoo',
  manjaro: 'arch',
  'manjaro-arm': 'arch',
  nixos: 'nixos',
  ol: 'rhel',
  opensuse: 'suse',
  'opensuse-leap': 'suse',
  'opensuse-tumbleweed': 'suse',
  rhel: 'rhel',
  rocky: 'rhel',
  sles: 'suse',
  suse: 'suse',
  ubuntu: 'debian',
  void: 'void',
};

/**
 * Packages that provide `qemu-img`, `qemu-system-<arch>` and the UEFI firmware
 * lima looks for, per {@link LinuxDistroFamily}. Firmware is listed explicitly
 * because some distros only recommend it (e.g. Debian's `qemu-system-arm`
 * recommends `qemu-efi-aarch64`).
 * @see https://repology.org/project/qemu/packages
 * @see https://repology.org/project/edk2/packages
 * @see https://packages.debian.org/trixie/qemu-utils
 * @see https://packages.debian.org/trixie/qemu-system-arm
 * @see https://packages.debian.org/trixie/qemu-system-x86
 * @see https://packages.debian.org/trixie/qemu-efi-aarch64
 * @see https://packages.debian.org/trixie/ovmf
 * @see https://packages.fedoraproject.org/pkgs/qemu/qemu-system-aarch64-core/
 * @see https://packages.fedoraproject.org/pkgs/edk2/edk2-aarch64/
 * @see https://mirror.stream.centos.org/10-stream/AppStream/x86_64/os/Packages/
 * @see https://gitlab.com/redhat/centos-stream/rpms/qemu-kvm
 * @see https://download.opensuse.org/tumbleweed/repo/oss/noarch/
 * @see https://archlinux.org/packages/extra/x86_64/qemu-img/
 * @see https://archlinux.org/packages/extra/x86_64/qemu-system-aarch64/
 * @see https://archlinux.org/packages/extra/any/edk2-aarch64/
 * @see https://pkgs.alpinelinux.org/package/edge/community/aarch64/qemu-system-aarch64
 * @see https://pkgs.alpinelinux.org/package/edge/community/x86_64/ovmf
 * @see https://github.com/void-linux/void-packages/blob/master/srcpkgs/qemu/template
 * @see https://packages.gentoo.org/packages/app-emulation/qemu
 * @see https://packages.gentoo.org/packages/sys-firmware/edk2-bin
 */
const INSTALL_PLANS: Record<
  Exclude<LinuxDistroFamily, 'nixos'>,
  QemuInstallPlan
> = {
  alpine: {
    packageManager: 'apk',
    packages: {
      aarch64: ['qemu-img', 'qemu-system-aarch64'],
      x86_64: ['qemu-img', 'qemu-system-x86_64', 'ovmf'],
    },
    steps: packages => [['apk', 'add', ...packages]],
  },
  arch: {
    packageManager: 'pacman',
    packages: {
      aarch64: ['qemu-img', 'qemu-system-aarch64', 'edk2-aarch64'],
      x86_64: ['qemu-img', 'qemu-system-x86', 'edk2-ovmf'],
    },
    steps: packages => [['pacman', '-S', '--needed', ...packages]],
  },
  debian: {
    packageManager: 'apt-get',
    packages: {
      aarch64: ['qemu-utils', 'qemu-system-arm', 'qemu-efi-aarch64'],
      x86_64: ['qemu-utils', 'qemu-system-x86', 'ovmf'],
    },
    steps: packages => [
      ['apt-get', 'update'],
      ['apt-get', 'install', ...packages],
    ],
  },
  fedora: {
    packageManager: 'dnf',
    packages: {
      aarch64: ['qemu-img', 'qemu-system-aarch64-core', 'edk2-aarch64'],
      x86_64: ['qemu-img', 'qemu-system-x86-core', 'edk2-ovmf'],
    },
    steps: packages => [['dnf', 'install', ...packages]],
  },
  gentoo: {
    packageManager: 'emerge',
    packages: {
      aarch64: ['app-emulation/qemu', 'sys-firmware/edk2-bin'],
      x86_64: ['app-emulation/qemu', 'sys-firmware/edk2-bin'],
    },
    steps: packages => [['emerge', '--ask', '--noreplace', ...packages]],
  },
  rhel: {
    packageManager: 'dnf',
    packages: {
      aarch64: ['qemu-img', 'qemu-kvm', 'edk2-aarch64'],
      x86_64: ['qemu-img', 'qemu-kvm', 'edk2-ovmf'],
    },
    steps: packages => [['dnf', 'install', ...packages]],
  },
  suse: {
    packageManager: 'zypper',
    packages: {
      aarch64: ['qemu-img', 'qemu-arm', 'qemu-uefi-aarch64'],
      x86_64: ['qemu-img', 'qemu-x86', 'qemu-ovmf-x86_64'],
    },
    steps: packages => [['zypper', 'install', ...packages]],
  },
  void: {
    packageManager: 'xbps-install',
    packages: {
      aarch64: ['qemu-img', 'qemu-system-aarch64'],
      x86_64: ['qemu-img', 'qemu-system-amd64'],
    },
    steps: packages => [['xbps-install', '-S', ...packages]],
  },
};

/**
 * The absolute UEFI firmware paths lima's QEMU driver searches, copied from
 * `getFirmware()` in the pinned lima release. Keep in sync when bumping
 * `LIMA_VERSION`.
 * @see https://github.com/lima-vm/lima/blob/v2.3.0/pkg/driver/qemu/qemu.go#L1364-L1437
 */
const LIMA_FIRMWARE_PATHS: Record<QemuArch, string[]> = {
  aarch64: [
    '/usr/share/AAVMF/AAVMF_CODE.fd',
    '/usr/share/qemu-efi-aarch64/QEMU_EFI.fd',
    '/usr/share/edk2/aarch64/QEMU_CODE.fd',
  ],
  x86_64: [
    '/usr/share/OVMF/OVMF_CODE_4M.fd',
    '/usr/share/OVMF/OVMF_CODE.fd',
    '/usr/share/edk2/ovmf/OVMF_CODE.fd',
    '/usr/share/edk2/x64/OVMF_CODE.4m.fd',
    '/usr/share/qemu/ovmf-x86_64-4m.bin',
    '/usr/share/qemu/ovmf-x86_64.bin',
  ],
};

/**
 * RHEL-family distros ship QEMU only as `%{_libexecdir}/qemu-kvm`, while lima
 * resolves `qemu-system-<arch>` from PATH.
 * @see https://gitlab.com/redhat/centos-stream/rpms/qemu-kvm/-/blob/c10s/qemu-kvm.spec
 * @see https://github.com/lima-vm/lima/blob/v2.3.0/pkg/driver/qemu/qemu.go#L1243-L1267
 */
const RHEL_QEMU_KVM_PATH = '/usr/libexec/qemu-kvm';
const QEMU_SHIM_DIR = path.join(TASTY_LIMA_CACHE, 'qemu-shims');
const UEFI_FIRMWARE_LABEL = 'UEFI firmware';

let QEMU_PATH_DIRS: string[] = [];

export function getQemuPathDirs(): string[] {
  return QEMU_PATH_DIRS;
}

function searchPath(): string[] {
  return [
    ...QEMU_PATH_DIRS,
    ...(process.env.PATH ?? '').split(path.delimiter),
  ].filter(Boolean);
}

async function findOnPath(command: string): Promise<string | undefined> {
  for (const dir of searchPath()) {
    const candidate = path.join(dir, command);
    if (await fileExists(candidate)) return candidate;
  }
  return undefined;
}

async function shimRhelQemuKvm(arch: QemuArch): Promise<string | undefined> {
  if (!(await fileExists(RHEL_QEMU_KVM_PATH))) return undefined;

  await fs.mkdir(QEMU_SHIM_DIR, { recursive: true });
  const shim = path.join(QEMU_SHIM_DIR, `qemu-system-${arch}`);
  await fs.rm(shim, { force: true });
  await fs.symlink(RHEL_QEMU_KVM_PATH, shim);
  if (!QEMU_PATH_DIRS.includes(QEMU_SHIM_DIR)) {
    QEMU_PATH_DIRS = [QEMU_SHIM_DIR, ...QEMU_PATH_DIRS];
  }
  logger.info('exposing the rhel qemu-kvm binary to limactl', {
    shim,
    target: RHEL_QEMU_KVM_PATH,
  });
  return shim;
}

async function findQemuSystem(arch: QemuArch): Promise<string | undefined> {
  return (
    (await findOnPath(`qemu-system-${arch}`)) ?? (await shimRhelQemuKvm(arch))
  );
}

/**
 * The prefix-relative `share/qemu/edk2-<arch>-code.fd` candidates lima checks
 * before its absolute paths: `$HOME/.local` and the parent of the QEMU binary's dir.
 * @see https://github.com/lima-vm/lima/blob/v2.3.0/pkg/driver/qemu/qemu.go#L1376-L1386
 */
async function bundledFirmwarePaths(
  arch: QemuArch,
  qemuSystem: string | undefined,
): Promise<string[]> {
  const firmwareName = `edk2-${arch}-code.fd`;
  const prefixes = [path.join(os.homedir(), '.local')];
  if (qemuSystem) {
    prefixes.push(path.dirname(path.dirname(qemuSystem)));
    const resolved = await fs.realpath(qemuSystem).catch(() => undefined);
    if (resolved) prefixes.push(path.dirname(path.dirname(resolved)));
  }
  return prefixes.map(prefix =>
    path.join(prefix, 'share', 'qemu', firmwareName),
  );
}

async function hasFirmware(
  arch: QemuArch,
  qemuSystem: string | undefined,
): Promise<boolean> {
  const candidates = [
    ...LIMA_FIRMWARE_PATHS[arch],
    ...(await bundledFirmwarePaths(arch, qemuSystem)),
  ];
  for (const candidate of candidates) {
    if (await fileExists(candidate)) return true;
  }
  return false;
}

async function findMissingQemuPieces(arch: QemuArch): Promise<string[]> {
  const missing: string[] = [];
  if (!(await findOnPath('qemu-img'))) missing.push('qemu-img');

  const qemuSystem = await findQemuSystem(arch);
  if (!qemuSystem) missing.push(`qemu-system-${arch}`);

  if (!(await hasFirmware(arch, qemuSystem))) {
    missing.push(UEFI_FIRMWARE_LABEL);
  }
  return missing;
}

function parseOsRelease(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match?.[1] || isNullOrUndefined(match[2])) continue;
    fields[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return fields;
}

async function readOsRelease(): Promise<Record<string, string>> {
  for (const file of ['/etc/os-release', '/usr/lib/os-release']) {
    const text = await fs.readFile(file, 'utf8').catch(() => undefined);
    if (!isNullOrUndefined(text)) return parseOsRelease(text);
  }
  return {};
}

async function detectDistro(): Promise<{
  family: LinuxDistroFamily | undefined;
  name: string;
}> {
  const osRelease = await readOsRelease();
  const ids = [osRelease.ID, ...(osRelease.ID_LIKE ?? '').split(/\s+/)]
    .filter((id): id is string => Boolean(id))
    .map(id => id.toLowerCase());
  const family = ids
    .map(id => DISTRO_FAMILY_BY_OS_RELEASE_ID[id])
    .find(Boolean);
  return {
    family,
    name: osRelease.PRETTY_NAME ?? osRelease.ID ?? 'this linux distro',
  };
}

function withPrivilege(steps: string[][]): string[][] {
  if (process.getuid?.() === 0) return steps;
  return steps.map(step => ['sudo', ...step]);
}

function formatSteps(steps: string[][]): string {
  return steps.map(step => step.join(' ')).join(' && ');
}

function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function confirm(question: string): Promise<boolean> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await readline.question(question);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    readline.close();
  }
}

async function runSteps(steps: string[][]): Promise<void> {
  for (const [file, ...args] of steps) {
    if (!file) continue;
    await execa(file, args, { stdio: 'inherit' });
  }
}

export async function ensureQemuLinux(): Promise<void> {
  const arch = QEMU_ARCHES[os.arch()];
  if (!arch) {
    logger.warn(
      `tasty-lima cannot provision qemu on ${os.arch()} linux hosts. install qemu-img, qemu-system and UEFI firmware for your architecture manually`,
    );
    return;
  }

  const missing = await findMissingQemuPieces(arch);
  if (missing.length === 0) {
    logger.info('using the system qemu');
    return;
  }

  const needs = `lima needs ${missing.join(', ')} to run VMs on linux`;
  const { family, name } = await detectDistro();
  if (family === 'nixos') {
    logger.warn(
      `${needs}. add qemu to environment.systemPackages (or run: nix profile install nixpkgs#qemu), then restart tasty-lima`,
    );
    return;
  }

  const plan = family ? INSTALL_PLANS[family] : undefined;
  if (!plan) {
    logger.warn(
      `${needs}, and tasty-lima does not know how to install qemu on ${name}. install qemu-img, qemu-system-${arch} and its UEFI firmware with your package manager, then restart tasty-lima`,
    );
    return;
  }

  const steps = withPrivilege(plan.steps(plan.packages[arch]));
  const printable = formatSteps(steps);
  if (steps[0]?.[0] === 'sudo' && !(await findOnPath('sudo'))) {
    logger.warn(
      `${needs}, and sudo is unavailable. as root, run: ${formatSteps(plan.steps(plan.packages[arch]))}`,
    );
    return;
  }
  if (!(await findOnPath(plan.packageManager))) {
    logger.warn(
      `${needs}, but ${plan.packageManager} was not found on ${name}. install qemu-img, qemu-system-${arch} and its UEFI firmware manually, then restart tasty-lima`,
    );
    return;
  }

  if (!isInteractive()) {
    logger.warn(
      `${needs}. creating and starting VMs will fail until you run: ${printable}`,
    );
    return;
  }

  const accepted = await confirm(
    `\n${needs}.\ntasty-lima can install them on ${name} with:\n\n  ${printable}\n\ninstall now? [y/N] `,
  );
  if (!accepted) {
    logger.warn(
      `skipped installing qemu. creating and starting VMs will fail until you run: ${printable}`,
    );
    return;
  }

  try {
    await runSteps(steps);
  } catch (error) {
    logger.error(
      `installing qemu failed. creating and starting VMs will fail until you run: ${printable}`,
      { error: errorToString(error) },
    );
    return;
  }

  const stillMissing = await findMissingQemuPieces(arch);
  if (stillMissing.length > 0) {
    logger.error(
      `the install finished, but ${stillMissing.join(', ')} still could not be found`,
    );
    return;
  }
  logger.info('installed the system qemu');
}
