import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { cartApi } from '@/lib/api/resources';
import { cartQueryKey, getRequestIdentity, quoteQueryKey } from '@/features/cart/identity';

export function useAddToCart(nftId: string, editionId: string | undefined) {
  const queryClient = useQueryClient();
  const identity = getRequestIdentity();

  return useMutation({
    mutationFn: (quantity: number) => cartApi.add(identity, { nftId, editionId: editionId as string, quantity }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey(identity) });
      void queryClient.invalidateQueries({ queryKey: quoteQueryKey(identity) });
    },
    // Availability race safety: the API is authoritative, so a conflict
    // triggers a fresh NFT fetch instead of trusting the rendered stock.
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        void queryClient.invalidateQueries({ queryKey: ['nfts', 'detail', nftId] });
      }
    },
  });
}