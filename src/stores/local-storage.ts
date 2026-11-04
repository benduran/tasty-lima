import type { Nullish } from '../shared/types.ts';
import { isNullOrUndefined } from '../shared/util.ts';

export function readFromLocalStorage<T>(
  key: string,
  parse: (val: string) => T,
) {
  const val = window.localStorage.getItem(key);
  if (isNullOrUndefined(val)) return val;

  return parse(val);
}

export function setToLocalStorage(
  key: string,
  stringify: () => Nullish<string>,
) {
  const val = stringify();
  const existing = window.localStorage.getItem(key);

  if (!val) {
    if (isNullOrUndefined(existing)) return;
    window.localStorage.removeItem(key);
    notifySubscribers(key, null);
    return;
  }

  if (existing === val) return;

  window.localStorage.setItem(key, val);
  notifySubscribers(key, val);
}

type StorageChangeHandler = (key: string, val: Nullish<string>) => void;

const subscribers = new Map<string, Set<StorageChangeHandler>>();

function notifySubscribers(key: string, val: Nullish<string>) {
  const handlers = subscribers.get(key);
  if (isNullOrUndefined(handlers)) return;

  for (const handler of [...handlers]) handler(key, val);
}

function storageEventHandler(ev: StorageEvent) {
  if (isNullOrUndefined(ev.key)) {
    for (const key of [...subscribers.keys()]) notifySubscribers(key, null);
    return;
  }

  notifySubscribers(ev.key, ev.newValue);
}

window.addEventListener('storage', storageEventHandler);

function addSubscriber(key: string, onChange: StorageChangeHandler) {
  const handlers = subscribers.get(key) ?? new Set<StorageChangeHandler>();
  handlers.add(onChange);
  subscribers.set(key, handlers);
}

function removeSubscriber(key: string, onChange: StorageChangeHandler) {
  const handlers = subscribers.get(key);
  if (isNullOrUndefined(handlers)) return;

  handlers.delete(onChange);
  if (handlers.size === 0) subscribers.delete(key);
}

export function subscribeToLocalStorage(
  key: string,
  onChange: StorageChangeHandler,
) {
  addSubscriber(key, onChange);

  return () => removeSubscriber(key, onChange);
}

export function unsubscribeToLocalStorage(
  key: string,
  onChange: StorageChangeHandler,
) {
  removeSubscriber(key, onChange);
}
