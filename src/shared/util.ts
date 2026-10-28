import type { Nullish } from './types.ts';

export function isNullOrUndefined(thing: unknown): thing is null | undefined {
  return typeof thing === 'undefined' || thing === undefined || thing === null;
}

export function isObject(thing: unknown) {
  return !isNullOrUndefined(thing) && typeof thing === 'object';
}

export function arrayHasItems<T>(arr: Nullish<T[]>): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}
