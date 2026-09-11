/**
 * Realtime ordering rules from `docs/REALTIME-CONTRACTS.md` §5:
 *
 * ```text
 * newer version → apply
 * same version  → ignore duplicate
 * older version → ignore
 * ```
 *
 * The guard is pure so it can be unit-tested without any socket or cache.
 */
export function shouldApplyRealtimeVersion(current: number | undefined, version: number): boolean {
  return current === undefined || version > current;
}

/**
 * Per-resource last-seen version tracker. `accept` records the version when the
 * event applies and returns whether the event must be applied. Duplicate and
 * stale events are rejected so they can never regress resource state.
 */
export function createRealtimeVersionTracker() {
  const lastSeen = new Map<string, number>();

  return {
    accept(resourceId: string, version: number): boolean {
      const current = lastSeen.get(resourceId);
      if (!shouldApplyRealtimeVersion(current, version)) {
        return false;
      }
      lastSeen.set(resourceId, version);
      return true;
    },
    reset() {
      lastSeen.clear();
    },
  };
}