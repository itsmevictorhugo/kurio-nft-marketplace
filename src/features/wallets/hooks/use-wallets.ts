import { useQuery } from '@tanstack/react-query';
import { walletsApi } from '@/lib/api/resources';
import type { CartIdentity } from '@/features/cart/identity';

export function walletsQueryKey(identity: CartIdentity) {
  return ['wallets', identity] as const;
}

function getTokenFromIdentity(identity: CartIdentity): string | undefined {
  return identity.token;
}

export function useWallets(identity: CartIdentity | null) {
  return useQuery({
    queryKey: ['wallets', identity],
    queryFn: () => walletsApi.list(getTokenFromIdentity(identity as CartIdentity) as string),
    enabled: Boolean(identity?.token),
    retry: false,
    select: (data) => data.items,
  });
}