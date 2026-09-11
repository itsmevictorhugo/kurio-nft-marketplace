import { queryClient } from '@/lib/query/query-client';

const TOKEN_KEY = 'kurio-session-token';

/**
 * Minimal session-token storage for the current milestone. Authentication UI
 * is a later task; this only gives already-issued tokens (from the mock API)
 * a place to live so authenticated resources can be exercised.
 *
 * On token change (login) or removal (logout/user switching) the private cart
 * and quotation caches are dropped so the next render reads the new
 * owner's data instead of a previous session's cached entries.
 */
function purgePrivateQueries() {
  queryClient.removeQueries({ queryKey: ['cart'] });
  queryClient.removeQueries({ queryKey: ['quote'] });
}

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable: token stays memory-only for this page life
  }
  purgePrivateQueries();
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  purgePrivateQueries();
}