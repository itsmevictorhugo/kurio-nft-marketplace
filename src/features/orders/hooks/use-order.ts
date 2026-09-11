import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/resources';

export function orderQueryKey(token: string, orderId: string) {
  return ['order', token, orderId] as const;
}

/**
 * Reads one order and keeps polling while it is pending: the mock backend
 * advances payment scenarios when the order is read, so a periodic refetch
 * drives pending → confirmed/rejected like the realtime channel would. Once
 * the order reaches a terminal status the polling stops.
 *
 * Confirmed orders reconcile the server-side cart: the purchased quantities
 * were already subtracted by the mock layer, so the local cart cache is
 * invalidated to reflect the new inventory.
 */
export function useOrder(orderId: string, token: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: orderQueryKey(token ?? '', orderId),
    queryFn: () => ordersApi.get(token as string, orderId),
    enabled: Boolean(token),
    retry: false,
    refetchInterval: (queryRef) => (queryRef.state.data?.order.status === 'pending' ? 3000 : false),
    select: (data) => data.order,
  });

  useEffect(() => {
    if (query.data?.status === 'confirmed') {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      void queryClient.invalidateQueries({ queryKey: ['quote'] });
    }
  }, [query.data?.status, queryClient]);

  return query;
}