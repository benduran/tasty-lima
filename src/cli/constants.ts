import os from 'node:os';
import path from 'node:path';

export const TASTY_LIMA_HOME = path.join(os.homedir(), '.tasty-lima');
export const TASTY_LIMA_CACHE = path.join(TASTY_LIMA_HOME, 'cache');

// Bump this when a new version of limactl is released.
// tasty lima is clamped to specific versions of limactl, for compatibility
export const LIMA_VERSION = '2.2.1' as const;
