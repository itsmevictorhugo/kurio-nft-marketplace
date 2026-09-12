import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { quoteApi } from '@/lib/api/resources';
import { getRequestIdentity, quoteQueryKey } from '@/features/cart/identity';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useSessionUser } from '@/features/auth/hooks/use-session';

/**
 * Quotes the current cart through `POST /quote`. The quote is the
 * authoritative source for subtotal, discount, network fee and total, and it
 * carries the applied coupon. Refetching is driven by invalidations after
 * every cart or coupon change; the coupon code is part of the query key so
 * apply/remove transitions produce a fresh quotation.
 */
export function useQuote(couponCode: string | undefined) {
  const user = useSessionUser();
  const identity = useMemo(getRequestIdentity, [user]);
  const cart = useCart();
  const hasItems = cart.data?.items.length !== undefined && cart.data.items.length > 0;

  return useQuery({
    queryKey: [...quoteQueryKey(identity), couponCode?.toUpperCase() ?? null],
    queryFn: () => quoteApi.create(identity, couponCode ? { couponCode: couponCode.toUpperCase() } : {}),
    enabled: hasItems,
    retry: false,
    select: (data) => data.quote,
  });
}