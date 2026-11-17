import type { StatusCodes } from 'http-status-codes';
import type { z } from 'zod';
import { API_TOKEN_HEADER } from '../shared/constants.ts';
import { apiToken } from './api-token.ts';

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

export async function jsonFetch<T extends z.ZodType>({
  allowedErrorStatuses = [],
  method = 'GET',
  schema,
  url,
  ...rest
}: JSONFetchOpts<T>): Promise<z.output<T>> {
  const headers = new Headers(rest.headers);
  if (apiToken) headers.set(API_TOKEN_HEADER, apiToken);
  const response = await fetch(url, { ...rest, headers, method });
  const body = await response.text();
  if (!response.ok && !allowedErrorStatuses.includes(response.status)) {
    throw new FetchError(url, method, response.status, body);
  }
  return schema.parse(JSON.parse(body));
}
