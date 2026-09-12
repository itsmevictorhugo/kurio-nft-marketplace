import { useEffect, useState } from 'react';
import { getGuestId, clearGuestCart } from '@/features/cart/guest-id';
import { queryClient } from '@/lib/query/query-client';
import { authApi } from '@/lib/api/resources';
import type { Session } from '@/types/domain';

const TOKEN_KEY = 'kurio-session-token';
const USER_KEY = 'kurio-session-user';
const SESSION_VERSION_KEY = 'kurio-session-version';

type SessionChangeListener = (token: string | null) => void;

const sessionChangeListeners = new Set<SessionChangeListener>();

/**
 * Subscribes to session token changes (login, logout and user switching).
 * The realtime layer uses this to tear down the previous session's socket
 * subscriptions and reconnect with the new session, so private events from a
 * previous user can never reach the current one.
 */
export function onSessionChange(listener: SessionChangeListener): () => void {
  sessionChangeListeners.add(listener);
  return () => {
    sessionChangeListeners.delete(listener);
  };
}

function notifySessionChange() {
  const token = getSessionToken();
  for (const listener of [...sessionChangeListeners]) {
    listener(token);
  }
}

export function getSessionVersion(): number {
  try {
    const raw = localStorage.getItem(SESSION_VERSION_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

function incrementSessionVersion(): number {
  try {
    const next = getSessionVersion() + 1;
    localStorage.setItem(SESSION_VERSION_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

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

export function getSessionUser(): Session['user'] | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSessionToken(token: string, user?: Session['user']): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch {
    // storage unavailable: token stays memory-only for this page life
  }
  purgePrivateQueries();
  notifySessionChange();
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
  purgePrivateQueries();
  notifySessionChange();
}

/**
 * Logs out the current user. Calls the server to invalidate the session
 * and clear the guest cart, but always clears local state and tears down
 * the realtime connection even if the server request fails.
 */
export async function logout(): Promise<void> {
  const token = getSessionToken();
  const guestId = getGuestId();
  if (token) {
    try {
      await authApi.logout(token, guestId);
    } finally {
      clearSessionToken();
    }
  }
  // Clear the guest cart for the current guest ID so the next guest session sees an empty cart
  await clearGuestCart(guestId);
  // Increment session version to force query key changes for all private queries
  incrementSessionVersion();
  // Clear all queries to force a complete refetch
  queryClient.clear();
  // Yield to the event loop so React state updates from onSessionChange propagate
  await Promise.resolve();
}

export function useSessionUser(): Session['user'] | undefined {
  const [cached, setCached] = useState<Session['user'] | null>(() => getSessionUser());

  useEffect(() => {
    return onSessionChange((token) => {
      if (token) {
        setCached(getSessionUser());
      } else {
        setCached(null);
      }
    });
  }, []);

  return cached ?? undefined;
}

export function useSessionVersion(): number {
  const [version, setVersion] = useState(() => getSessionVersion());

  useEffect(() => {
    return onSessionChange(() => {
      setVersion(getSessionVersion());
    });
  }, []);

  return version;
}