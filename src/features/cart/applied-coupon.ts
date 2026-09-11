const STORAGE_KEY = 'kurio-applied-coupon';

/**
 * Persists the coupon code applied in the cart across navigation so the
 * checkout step re-quotes with the same discount the shopper had reviewed.
 * The code is best-effort local state, not a server-owned resource: it is
 * re-validated by the quote endpoint on every read.
 */
export function getAppliedCoupon(): string | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw && raw.trim() ? raw.toUpperCase() : undefined;
  } catch {
    return undefined;
  }
}

export function setAppliedCoupon(code: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, code.toUpperCase());
  } catch {
    // storage unavailable: coupon stays in memory for this page life
  }
}

export function clearAppliedCoupon(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}