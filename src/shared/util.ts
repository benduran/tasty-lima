export function isNullOrUndefined(thing: unknown): thing is null | undefined {
  return typeof thing === 'undefined' || thing === undefined || thing === null;
}

export function isObject(thing: unknown) {
  return !isNullOrUndefined(thing) && typeof thing === 'object';
}
