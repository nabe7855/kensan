/** A new deploy removed the code chunk this page tried to load; a reload fetches the current one. */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ChunkLoadError" ||
    /Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i.test(
      error.message,
    )
  );
}

const KEY = "kensan:chunk-reload";

/** Reload once per minute at most, so a real outage does not loop. */
export function shouldReloadForChunk(error: unknown, now: number, last: number | null): boolean {
  return isChunkLoadError(error) && (last === null || now - last > 60_000);
}

export function reloadForChunkOnce(error: unknown): boolean {
  let last: number | null = null;
  try {
    const v = sessionStorage.getItem(KEY);
    last = v ? Number(v) : null;
  } catch {}
  const now = Date.now();
  if (!shouldReloadForChunk(error, now, last)) return false;
  try {
    sessionStorage.setItem(KEY, String(now));
  } catch {}
  window.location.reload();
  return true;
}
