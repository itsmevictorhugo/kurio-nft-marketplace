import { getSessionToken, getSessionVersion } from '@/features/auth/session';
import { getGuestId } from '@/features/cart/guest-id';
import type { RequestIdentity } from '@/lib/api/resources';

export type CartIdentity = RequestIdentity & { sessionVersion: number };

/**
 * Single identity resolver for cart and quotation resources: an authenticated
 * token when present, otherwise the stable per-browser guest id. All cart
 * features must resolve identity here so guest and authenticated carts never
 * share cache entries.
 */
export function getRequestIdentity(): CartIdentity {
  const token = getSessionToken();
  const sessionVersion = getSessionVersion();
  return token ? { token, sessionVersion } : { guestId: getGuestId(), sessionVersion };
}

export function cartQueryKey(identity: CartIdentity = getRequestIdentity()) {
  return ['cart', identity] as const;
}

export function quoteQueryKey(identity: CartIdentity = getRequestIdentity()) {
  return ['quote', identity] as const;
}