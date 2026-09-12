import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/lib/api/resources';
import { cartQueryKey, getRequestIdentity, quoteQueryKey } from '@/features/cart/identity';
import { useSessionVersion } from '@/features/auth/session';
import type { CartResponse } from '@/types/api';

const pendingPerItem = new Map<string, Promise<unknown>>();

/**
 * Serializes async work per key so rapid stepper clicks cannot have an older
 * request complete after a newer one and clobber the authoritative value.
 * The server applies absolute quantities, so the last request wins as long as
 * requests are ordered per item.
 */
export function withSerializedMutation<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = pendingPerItem.get(key) ?? Promise.resolve();
  const next = previous.then(task, task);
  pendingPerItem.set(
    key,
    next.catch(() => undefined),
  );
  return next;
}

function readCart(queryClient: ReturnType<typeof useQueryClient>, identity: ReturnType<typeof getRequestIdentity>) {
  return queryClient.getQueryData<CartResponse>(cartQueryKey(identity));
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient();
  const sessionVersion = useSessionVersion();
  const identity = useMemo(getRequestIdentity, [sessionVersion]);

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      withSerializedMutation(itemId, () => cartApi.update(identity, itemId, { quantity })),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey(identity) });
      const previous = readCart(queryClient, identity);
      queryClient.setQueryData<CartResponse>(cartQueryKey(identity), (current) =>
        current
          ? {
              cart: {
                ...current.cart,
                items: current.cart.items.map((item) =>
                  item.id === itemId ? { ...item, quantity } : item,
                ),
              },
            }
          : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<CartResponse>(cartQueryKey(identity), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey(identity) });
      void queryClient.invalidateQueries({ queryKey: quoteQueryKey(identity) });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const sessionVersion = useSessionVersion();
  const identity = useMemo(getRequestIdentity, [sessionVersion]);

  return useMutation({
    mutationFn: (itemId: string) => withSerializedMutation(itemId, () => cartApi.remove(identity, itemId)),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey(identity) });
      const previous = readCart(queryClient, identity);
      queryClient.setQueryData<CartResponse>(cartQueryKey(identity), (current) =>
        current
          ? { cart: { ...current.cart, items: current.cart.items.filter((item) => item.id !== itemId) } }
          : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<CartResponse>(cartQueryKey(identity), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey(identity) });
      void queryClient.invalidateQueries({ queryKey: quoteQueryKey(identity) });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  const sessionVersion = useSessionVersion();
  const identity = useMemo(getRequestIdentity, [sessionVersion]);

  return useMutation({
    mutationFn: () => withSerializedMutation('clear-cart', () => cartApi.clear(identity)),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey(identity) });
      void queryClient.invalidateQueries({ queryKey: quoteQueryKey(identity) });
    },
  });
}