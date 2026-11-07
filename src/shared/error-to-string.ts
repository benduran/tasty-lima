import { ZodError } from 'zod';
import { isNullOrUndefined } from './util.ts';

/**
 * given an object that may be error-like,
 * attempts to return the most appropriate,
 * useful string representation of the error
 */
export function errorToString(error: unknown) {
  const defaultReturn = 'Unknown Error';

  if (isNullOrUndefined(error)) {
    return defaultReturn;
  }

  if (error instanceof ZodError) {
    const message = error.issues
      .map(issue => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join(', ');
    if (error.stack) {
      return `${message}
${error.stack}`.trim();
    }
    return message;
  }

  if (error instanceof Error) {
    if (error.stack) {
      return `${error.message}
${error.stack}`.trim();
    }
    return error.message;
  }
  if (typeof error === 'string') {
    // might be a JSON string.
    // let's try to parse it into an object first
    try {
      const parsed: unknown = JSON.parse(error);

      return errorToString(parsed);
    } catch {
      return error;
    }
  }
  if (typeof error === 'object') {
    if (!isNullOrUndefined(error)) {
      if ('error' in error) return errorToString(error.error);
      if ('message' in error) return errorToString(error.message);
    }
    return JSON.stringify(error);
  }
  return defaultReturn;
}
