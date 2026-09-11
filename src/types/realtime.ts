import type { Nft, Order } from '@/types/domain';

export type RealtimeServerEventName = 'nft.updated' | 'order.updated';

export type RealtimeEventName = RealtimeServerEventName | 'session:hello';

/**
 * The realtime event envelope defined by `docs/REALTIME-CONTRACTS.md`:
 * every event carries a stable identity (`eventId`), the affected resource
 * (`resourceId`) and a monotonically increasing `version` so clients can
 * ignore duplicates, stale and out-of-order events without regressing state.
 */
export interface RealtimeEnvelope<T> {
  eventId: string;
  resourceId: string;
  version: number;
  payload: T;
}

export interface NftUpdatedPayload {
  nft: Nft;
}

export interface OrderUpdatedPayload {
  order: Order;
}

export interface SessionHelloPayload {
  token: string;
}