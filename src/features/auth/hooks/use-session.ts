import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/resources';
import { getSessionToken, onSessionChange } from '@/features/auth/session';
import type { Session } from '@/types/domain';

export function sessionQueryKey(token: string | null) {
  return ['session', token] as const;
}

/**
 * Reads the authenticated session (user profile snapshot) for the current
 * token. Private per-session data; disabled without a token and dropped by the
 * session purge on logout/user switching.
 */
export function useSession() {
  const [token, setToken] = useState<string | null>(() => getSessionToken());

  useEffect(() => {
    return onSessionChange(setToken);
  }, []);

  return useQuery({
    queryKey: sessionQueryKey(token),
    queryFn: () => authApi.session(token as string),
    enabled: Boolean(token),
    retry: false,
    select: (data) => data.session,
  });
}

export function useSessionUser(): Session['user'] | undefined {
  return useSession().data?.user;
}