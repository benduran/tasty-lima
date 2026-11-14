export function withExistingQuery(newLocation: string) {
  const url = new URL(newLocation, window.location.origin);
  const q = new URLSearchParams(window.location.search);
  for (const [key, val] of url.searchParams) {
    q.set(key, val);
  }
  url.search = q.toString();
  return url.toString();
}
