import { useEffect, useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { realtimeClient } from '@/lib/socket/realtime-client';
import type { RealtimeLifecycleEvent } from '@/lib/socket/realtime-client';
import { getSessionToken, onSessionChange } from '@/features/auth/session';
import { getRequestIdentity } from '@/features/cart/identity';
import { createRealtimeVersionTracker } from '@/features/realtime/lib/version-guard';
import type { NftUpdatedPayload, OrderUpdatedPayload, RealtimeEnvelope } from '@/types/realtime';

function realtimeEndpoint(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://127.0.0.1:4173';
}

function invalidateCurrentQuote(queryClient: QueryClient) {
  return void queryClient.invalidateQueries({ queryKey: ['quote', getRequestIdentity()] });
}

/**
 * Owns the realtime subscriptions for the lifetime of the application session.
 *
 * - connects the single Socket.IO client with the current session token;
 * - applies the version ordering rules (duplicates/stale events are ignored);
 * - on accepted `nft.updated` the affected NFT surfaces (catalog, detail,
 *   overview) and the current quotation are revalidated;
 * - on accepted `order.updated` the owning order (and the cart/quote when
 *   confirmed) is revalidated;
 * - after reconnection the active resources are reconciled through REST;
 * - on logout or user switching every subscription is released and the
 *   previous session's socket is dropped, so private events from an earlier
 *   session can never reach the current user.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getSessionToken());

  useEffect(() => onSessionChange(setToken), []);

  useEffect(() => {
    const versions = createRealtimeVersionTracker();

    const onNftUpdated = (envelope: RealtimeEnvelope<NftUpdatedPayload>) => {
      if (!versions.accept(envelope.resourceId, envelope.version)) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['nfts', 'detail', envelope.resourceId] });
      void queryClient.invalidateQueries({ queryKey: ['nfts', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['nfts', 'overview'] });
      invalidateCurrentQuote(queryClient);
    };

    const onOrderUpdated = (envelope: RealtimeEnvelope<OrderUpdatedPayload>) => {
      if (!versions.accept(envelope.resourceId, envelope.version)) {
        return;
      }
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['order', sessionToken, envelope.resourceId] });
      if (envelope.payload.order.status === 'confirmed') {
        const identity = getRequestIdentity();
        void queryClient.invalidateQueries({ queryKey: ['quote', identity] });
        void queryClient.invalidateQueries({ queryKey: ['cart', identity] });
      }
    };

    const onLifecycle = (event: RealtimeLifecycleEvent) => {
      if (event.kind !== 'reconnect') {
        return;
      }
      // REST reconciliation after reconnection: the latest authoritative state
      // wins for the resources the session was actively holding.
      void queryClient.invalidateQueries({ queryKey: ['nfts'] });
      invalidateCurrentQuote(queryClient);
      const sessionToken = getSessionToken();
      if (sessionToken) {
        void queryClient.invalidateQueries({ queryKey: ['order', sessionToken] });
      }
    };

    const offLifecycle = realtimeClient.onLifecycle(onLifecycle);
    realtimeClient.subscribe('nft.updated', onNftUpdated);
    realtimeClient.subscribe('order.updated', onOrderUpdated);
    realtimeClient.connect(realtimeEndpoint(), token);

    return () => {
      offLifecycle();
      realtimeClient.unsubscribe('nft.updated', onNftUpdated);
      realtimeClient.unsubscribe('order.updated', onOrderUpdated);
      realtimeClient.disconnect();
      versions.reset();
    };
  }, [queryClient, token]);
}

export function RealtimeSync() {
  useRealtimeSync();
  return null;
}