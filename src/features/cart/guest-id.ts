const GUEST_ID_KEY = 'kurio-guest-id';

/**
 * Stable per-browser guest identity used for guest cart ownership, matching
 * the `X-Guest-Id` contract of the mock API.
 */
export function getGuestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_ID_KEY);
    if (existing) {
      return existing;
    }
    const guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
    return guestId;
  } catch {
    return 'kurio-guest-fallback';
  }
}
