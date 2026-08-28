const storageKey = (spaceId: string): string => `fundamento:sidebar:expanded:${spaceId}`;

export function loadExpanded(spaceId: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey(spaceId));
    if (!raw) return new Set<string>();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set<string>(parsed as string[]) : new Set<string>();
  } catch {
    // Private mode, disabled storage, or corrupt value — expansion is not worth failing over.
    return new Set<string>();
  }
}

export function saveExpanded(spaceId: string, ids: Set<string>): void {
  try {
    window.localStorage.setItem(storageKey(spaceId), JSON.stringify([...ids]));
  } catch {
    // Quota or private mode — ignore.
  }
}
