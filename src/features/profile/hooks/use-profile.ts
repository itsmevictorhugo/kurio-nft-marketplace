import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/lib/api/resources';

export function profileQueryKey(token: string) {
  return ['profile', token] as const;
}

export function useProfile(token: string | null) {
  return useQuery({
    queryKey: ['profile', token],
    queryFn: () => profileApi.get(token as string),
    enabled: Boolean(token),
    retry: false,
    select: (data) => data.profile,
  });
}