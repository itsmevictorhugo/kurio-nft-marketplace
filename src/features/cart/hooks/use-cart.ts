import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { cartApi, nftApi } from '@/lib/api/resources';
import { cartQueryKey, getRequestIdentity } from '@/features/cart/identity';
import { useSessionUser } from '@/features/auth/hooks/use-session';
import type { Cart, CartItem, Nft } from '@/types/domain';

export function useCart() {
  const user = useSessionUser();
  const identity = useMemo(getRequestIdentity, [user]);
  return useQuery({
    queryKey: cartQueryKey(identity),
    queryFn: () => cartApi.get(identity),
    select: (data) => data.cart,
    retry: false,
  });
}

/**
 * Joins cart items with their NFT records so the cart page can render
 * artwork, names, edition labels, prices and purchase limits without a new
 * REST resource. Fetching is parallel per unique NFT and reuses the shared
 * `['nfts', 'detail', id]` cache used by the detail page.
 */
export function useCartItemDetails(items: CartItem[] | undefined) {
  const nftIds = useMemo(
    () => Array.from(new Set((items ?? []).map((item) => item.nftId))),
    [items],
  );

  const detailQueries = useQueries({
    queries: nftIds.map((nftId) => ({
      queryKey: ['nfts', 'detail', nftId] as const,
      queryFn: () => nftApi.get(nftId),
      retry: false,
    })),
  });

  return useMemo(() => {
    const byId = new Map<string, Nft>();
    detailQueries.forEach((query, index) => {
      if (query.data) {
        byId.set(nftIds[index], query.data);
      }
    });
    return byId;
  }, [detailQueries, nftIds]);
}

export interface CartItemDisplay {
  item: CartItem;
  nft: Nft | undefined;
  editionName: string | undefined;
  unitPrice: string | undefined;
}

export function describeCartItem(item: CartItem, nftsById: Map<string, Nft>): CartItemDisplay {
  const nft = nftsById.get(item.nftId);
  const edition = nft?.editions.find((candidate) => candidate.id === item.editionId);
  return {
    item,
    nft,
    editionName: edition?.name,
    unitPrice: nft?.price,
  };
}

export function cartItemCount(cart: Cart | undefined) {
  return (cart?.items ?? []).reduce((total, item) => total + item.quantity, 0);
}