import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { getSessionToken } from '@/features/auth/session';
import { getGuestId } from '@/features/cart/guest-id';
import { cartApi, type RequestIdentity } from '@/lib/api/resources';

export function useAddToCart(nftId: string, editionId: string | undefined) {
  const queryClient = useQueryClient();
  const token = getSessionToken();
  const identity: RequestIdentity = token ? { token } : { guestId: getGuestId() };

  return useMutation({
    mutationFn: (quantity: number) => cartApi.add(identity, { nftId, editionId: editionId as string, quantity }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
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
