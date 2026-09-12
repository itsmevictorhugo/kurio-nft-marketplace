import { ws, type WebSocketHandlerConnection } from 'msw';
import { toSocketIo } from '@mswjs/socket.io-binding';
import { getSession } from '@/mocks/database/mock-database';
import type {
  NftUpdatedPayload,
  OrderUpdatedPayload,
  RealtimeEnvelope,
  RealtimeEventName,
  SessionHelloPayload,
} from '@/types/realtime';

/**
 * The mock Socket.IO server. The application's `socket.io-client` connection
 * is intercepted by the MSW WebSocket transport (`ws.link`) and this hub
 * emulates the server side of the protocol using the `@mswjs/socket.io-binding`
 * transport (the binding encodes/decodes the Socket.IO protocol over the
 * intercepted WebSocket).
 *
 * The hub mirrors a broadcast server:
 * - `nft.updated` is a public event broadcast to every connected client;
 * - `order.updated` is routed only to the connections whose authenticated user
 *   owns the order (registered through the `session:hello` event).
 *
 * REST remains authoritative; this hub only publishes state changes that were
 * already applied to the mock database by the REST handlers.
 */
function resolveSocketEndpoint(): string {
  const host =
    typeof window !== 'undefined' && window.location?.host
      ? window.location.host
      : '127.0.0.1:4173';
  const scheme =
    typeof window !== 'undefined' && window.location?.protocol === 'https:' ? 'wss' : 'ws';
  // Trailing `/*` is required: the service worker strips `/socket.io/` from the
  // client URL but keeps the trailing slash, which would otherwise not match.
  // The scheme must follow the page protocol: on HTTPS deployments the
  // `socket.io-client` connects through `wss://`, and MSW only intercepts it
  // when the registered link uses the same scheme.
  return `${scheme}://${host}/*`;
}

export const realtimeSocketLink = ws.link(resolveSocketEndpoint());

interface HubConnection {
  readonly id: number;
  userId: string | null;
  emit(event: RealtimeEventName, envelope: RealtimeEnvelope<unknown>): void;
  close(): void;
}

let nextConnectionId = 1;
const activeConnections = new Map<number, HubConnection>();
let nextEventCounter = 0;

export function createRealtimeEnvelope<T>(
  resourceId: string,
  version: number,
  payload: T,
): RealtimeEnvelope<T> {
  nextEventCounter += 1;
  return { eventId: `evt-${nextEventCounter}`, resourceId, version, payload };
}

export function broadcastNftUpdated(envelope: RealtimeEnvelope<NftUpdatedPayload>) {
  for (const connection of activeConnections.values()) {
    connection.emit('nft.updated', envelope);
  }
}

export function broadcastOrderUpdated(userId: string, envelope: RealtimeEnvelope<OrderUpdatedPayload>) {
  for (const connection of activeConnections.values()) {
    if (connection.userId === userId) {
      connection.emit('order.updated', envelope);
    }
  }
}

export function closeAllRealtimeConnections() {
  for (const connection of [...activeConnections.values()]) {
    connection.close();
  }
}

export function realtimeConnectionCount() {
  return activeConnections.size;
}

export const realtimeServerHandlers = [
  realtimeSocketLink.addEventListener('connection', (connection: WebSocketHandlerConnection) => {
    const socketIo = toSocketIo(connection);
    const id = nextConnectionId++;
    const entry: HubConnection = {
      id,
      userId: null,
      emit(event, envelope) {
        socketIo.client.emit(event, envelope);
      },
      close() {
        connection.client.close();
      },
    };
    activeConnections.set(id, entry);

    // The client announces its session token after connecting so the hub can
    // route private events to the right user. Unknown tokens stay guests.
    socketIo.client.on('session:hello', (_event, payload?: SessionHelloPayload) => {
      const session = payload?.token ? getSession(payload.token) : undefined;
      entry.userId = session?.userId ?? null;
    });

    // engine.io heartbeat: answer pings so the browser keeps the socket alive.
    connection.client.addEventListener('message', (messageEvent) => {
      if (typeof messageEvent.data !== 'string') {
        return;
      }
      if (messageEvent.data === '2') {
        connection.client.send('3');
      } else if (messageEvent.data === '2probe') {
        connection.client.send('3probe');
      }
    });

    connection.client.addEventListener('close', () => {
      activeConnections.delete(id);
    });
  }),
];