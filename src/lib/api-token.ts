import { API_TOKEN_PARAM } from '../shared/constants.ts';

const STORAGE_KEY = 'tasty-lima-token' as const;

function captureApiToken() {
  const { hash, pathname, search } = window.location;
  const params = new URLSearchParams(hash.slice(1));
  const fromHash = params.get(API_TOKEN_PARAM);
  if (!fromHash) return window.sessionStorage.getItem(STORAGE_KEY);

  window.sessionStorage.setItem(STORAGE_KEY, fromHash);
  params.delete(API_TOKEN_PARAM);
  const remaining = params.toString();
  window.history.replaceState(
    window.history.state,
    '',
    `${pathname}${search}${remaining ? `#${remaining}` : ''}`,
  );
  return fromHash;
}

export const apiToken = captureApiToken();
