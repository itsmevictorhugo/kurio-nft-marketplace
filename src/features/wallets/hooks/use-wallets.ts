import { useQuery } from '@tanstack/react-query';
import { walletsApi } from '@/lib/api/resources';

export function walletsQueryKey(token: string) {
  return ['wallets', token] as const;
}

export function useWallets(token: string | null) {
  return useQuery({
    queryKey: ['wallets', token],
    queryFn: () => walletsApi.list(token as string),
    enabled: Boolean(token),
    retry: false,
    select: (data) => data.items,
  });
}