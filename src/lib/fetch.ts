import type { StatusCodes } from 'http-status-codes';
import type { z } from 'zod';

type JSONFetchOpts<S extends z.ZodType> = RequestInit & {
  allowedErrorStatuses?: StatusCodes[];
  schema: S;
  url: string;
};

export class FetchError extends Error {
  constructor(
    public readonly url: string,
    public readonly method: string,
    public readonly code: number,
    message: string,
  ) {
    super(`${method.toUpperCase()} ${url} failed with ${code}: ${message}`);
  }
}

type JSONFetchReturnType<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

export async function jsonFetch<T extends z.ZodType>({
  allowedErrorStatuses = [],
  method = 'GET',
  schema,
  url,
  ...rest
}: JSONFetchOpts<T>): Promise<JSONFetchReturnType<z.output<T>>> {
  const response = await fetch(url, { method, ...rest });
  const body = await response.text();
  if (!response.ok) {
    if (!allowedErrorStatuses.includes(response.status)) {
      throw new FetchError(url, method, response.status, body);
    }
    return { error: body, ok: false };
  }
  return { data: schema.parse(JSON.parse(body)), ok: true };
}
