import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import winston from 'winston';

/**
 * Process-wide logger for the tasty-lima CLI, built on winston (which ships
 * its own TypeScript typings — unlike much of pino's transport ecosystem).
 *
 * Every line goes to two places:
 *   1. stdout (stderr for `error`-level lines, so piped output stays clean)
 *   2. a size-rotated log file, via winston's built-in `maxsize`/`maxFiles`
 *      File-transport support — no plugin packages needed.
 *
 * Usage — just import and log, nothing to initialize:
 *   import { logger } from './logger.ts';
 *   logger.info('created vm', { name: 'ubuntu-2404' });
 */

const LOG_FILE = path.join(
  os.homedir(),
  '.local',
  'share',
  'tasty-lima',
  'logs',
  'tasty-lima.log',
);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MiB per file before it rotates
const MAX_FILES = 5; // total files kept (active + rotated) => at most ~50 MiB on disk

// Create the log directory eagerly so the first log call never throws.
mkdirSync(path.dirname(LOG_FILE), { recursive: true });

const consoleFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const extras =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${stack ?? message}${extras}`;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.json(),
);

export const logger = winston.createLogger({
  // A failed transport must never take the CLI down.
  exitOnError: false,
  level: 'info',
  transports: [
    // Human-readable output. `error`-level lines go to stderr so that piping
    // stdout (e.g. `tasty-lima ... | grep`) stays clean.
    new winston.transports.Console({
      format: consoleFormat,
      stderrLevels: ['error'],
    }),
    // Machine-readable JSON lines, rotated once a file exceeds
    // MAX_FILE_SIZE_BYTES. winston checks after writing, so a file can end up
    // at most one log line over the limit. `tailable` keeps the newest entries
    // in the base file (`tail -f tasty-lima.log` behaves like logrotate);
    // backups are `tasty-lima1.log` (newest), `tasty-lima2.log`, etc.
    new winston.transports.File({
      filename: LOG_FILE,
      format: fileFormat,
      maxFiles: MAX_FILES,
      maxsize: MAX_FILE_SIZE_BYTES,
      tailable: true,
    }),
  ],
});
