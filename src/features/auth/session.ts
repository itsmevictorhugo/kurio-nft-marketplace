import { queryClient } from '@/lib/query/query-client';

const TOKEN_KEY = 'kurio-session-token';

/**
 * Session-token storage for the mock session. On token change (login) or
 * removal (logout/user switching) every private, per-session cache is dropped
 * so the next render reads the new owner's data instead of a previous
 * session's cached entries. Quotes are unauthenticated too, but they carry the
 * requesting owner's cart contents, so they are private as well.
 */
function purgePrivateQueries() {
  queryClient.removeQueries({ queryKey: ['cart'] });
  queryClient.removeQueries({ queryKey: ['quote'] });
  queryClient.removeQueries({ queryKey: ['order'] });
  queryClient.removeQueries({ queryKey: ['session'] });
  queryClient.removeQueries({ queryKey: ['profile'] });
  queryClient.removeQueries({ queryKey: ['wallets'] });
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