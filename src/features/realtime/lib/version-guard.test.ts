import { describe, expect, it } from 'vitest';
import { createRealtimeVersionTracker, shouldApplyRealtimeVersion } from '@/features/realtime/lib/version-guard';

describe('shouldApplyRealtimeVersion', () => {
  it('applies an event with no prior version', () => {
    expect(shouldApplyRealtimeVersion(undefined, 3)).toBe(true);
  });

  it('applies a newer version', () => {
    expect(shouldApplyRealtimeVersion(3, 4)).toBe(true);
  });

  it('rejects a duplicate version', () => {
    expect(shouldApplyRealtimeVersion(3, 3)).toBe(false);
  });

  it('rejects an older version', () => {
    expect(shouldApplyRealtimeVersion(3, 2)).toBe(false);
  });
});

describe('createRealtimeVersionTracker', () => {
  it('accepts the first event per resource', () => {
    const tracker = createRealtimeVersionTracker();
    expect(tracker.accept('nft-aurora', 2)).toBe(true);
  });

  it('rejects duplicates and stale events while older than the last seen version', () => {
    const tracker = createRealtimeVersionTracker();
    expect(tracker.accept('nft-aurora', 2)).toBe(true);
    expect(tracker.accept('nft-aurora', 2)).toBe(false);
    expect(tracker.accept('nft-aurora', 1)).toBe(false);
    expect(tracker.accept('nft-aurora', 3)).toBe(true);
    expect(tracker.accept('nft-aurora', 3)).toBe(false);
  });

  it('tracks resources independently', () => {
    const tracker = createRealtimeVersionTracker();
    expect(tracker.accept('nft-aurora', 2)).toBe(true);
    expect(tracker.accept('order-1', 1)).toBe(true);
    expect(tracker.accept('nft-aurora', 1)).toBe(false);
    expect(tracker.accept('order-1', 1)).toBe(false);
  });

  it('forgets every resource on reset', () => {
    const tracker = createRealtimeVersionTracker();
    expect(tracker.accept('nft-aurora', 5)).toBe(true);
    expect(tracker.accept('nft-aurora', 5)).toBe(false);
    tracker.reset();
    expect(tracker.accept('nft-aurora', 5)).toBe(true);
  });
});