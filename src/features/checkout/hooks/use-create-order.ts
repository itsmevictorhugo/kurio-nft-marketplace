import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ordersApi } from '@/lib/api/resources';

export function isOrderTimeout(error: unknown) {
  return isAxiosError(error) && error.response?.status === 504;
}

export function isOrderSessionError(error: unknown) {
  return isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403);
}

type OrderConflictKind = 'stale' | 'availability' | 'coupon';

export function orderConflictKind(error: unknown): OrderConflictKind | undefined {
  if (!isAxiosError<{ error?: { code?: string } }>(error)) {
    return undefined;
  }
  if (error.response?.status !== 409) {
    return undefined;
  }
  const code = error.response.data?.error?.code;
  if (code === 'stale_quote') return 'stale';
  if (code === 'availability_conflict') return 'availability';
  if (code === 'coupon_invalid' || code === 'coupon_expired') return 'coupon';
  return undefined;
}

/**
 * Creates the order through `POST /orders` with an explicit idempotency key.
 * TanStack Query owns the mutation so loading/error are reactive; retry is
 * disabled here because the checkout flow retries deliberately (once, with the
 * same key) instead of letting Query decide.
 */
export function useCreateOrder(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quoteId, idempotencyKey }: { quoteId: string; idempotencyKey: string }) =>
      ordersApi.create(token, { quoteId }, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      void queryClient.invalidateQueries({ queryKey: ['quote'] });
    },
    retry: false,
    onError: (error) => {
      if (orderConflictKind(error) === 'availability') {
        void queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    },
  });
}