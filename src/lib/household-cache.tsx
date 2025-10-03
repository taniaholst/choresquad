type Fetcher<T> = () => Promise<T>;

const cache = new Map<string, string>(); // householdId -> name
const inflight = new Map<string, Promise<string>>(); // de-dupe concurrent fetches

export function getCachedHouseholdName(id: string) {
  return cache.get(id) ?? null;
}

export function setCachedHouseholdName(id: string, name: string) {
  cache.set(id, name);
}

export async function fetchHouseholdName(
  id: string,
  fetcher: Fetcher<{ name: string }>,
): Promise<string | null> {
  if (cache.has(id)) return cache.get(id)!; // hit
  if (inflight.has(id)) return inflight.get(id)!; // reuse in-flight

  const p = (async () => {
    try {
      const { name } = await fetcher();
      cache.set(id, name);
      return name;
    } finally {
      inflight.delete(id);
    }
  })();

  inflight.set(id, p);
  return p;
}
