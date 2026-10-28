import os from 'node:os';
import path from 'node:path';

export const TASTY_LIMA_HOME = path.join(os.homedir(), '.tasty-lima');
export const TASTY_LIMA_CACHE = path.join(TASTY_LIMA_HOME, 'cache');
