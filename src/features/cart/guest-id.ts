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

/**
 * Clears the guest cart for the given guest ID by calling the mock API.
 * This is used on logout to ensure the guest cart is empty.
 */
export async function clearGuestCart(guestId: string): Promise<void> {
  try {
    await fetch('/api/cart', {
      method: 'DELETE',
      headers: { 'X-Guest-Id': guestId },
    });
  } catch {
    // Best effort; ignore network errors
  }
}
