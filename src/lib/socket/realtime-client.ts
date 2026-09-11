import type { Socket } from 'socket.io-client';
import type { RealtimeEnvelope, RealtimeServerEventName } from '@/types/realtime';

export type RealtimeLifecycleEvent =
  | { kind: 'connect' }
  | { kind: 'disconnect'; reason: string }
  | { kind: 'reconnect' };

type RealtimeEventHandler = (envelope: RealtimeEnvelope<unknown>) => void;

/**
 * The `socket.io-client` module is imported lazily so it is evaluated at
 * runtime, after MSW has patched the global `WebSocket` constructor. If it
 * were statically imported, `engine.io-client` would capture the native
 * `WebSocket` at module evaluation time and its connections would never be
 * intercepted by the MSW socket transport.
 */
let socketIoModulePromise: Promise<typeof import('socket.io-client')> | undefined;

function loadSocketIo(): Promise<typeof import('socket.io-client')> {
  socketIoModulePromise ??= import('socket.io-client');
  return socketIoModulePromise;
}

/**
 * Owns the single `socket.io-client` connection of the application. It forces
 * the WebSocket transport because that is the transport MSW intercepts (the
 * polling transport is not mockable through the service worker / interceptor).
 *
 * On every (re)connect the client announces its session token through the
 * `session:hello` event so the mock hub can route private events; listeners
 * are managed here so they can be cleaned up when the session changes or the
 * component unmounts.
 */
export class RealtimeClient {
  private socket: Socket | undefined;
  private connectGeneration = 0;
  private connecting = false;
  private subscriptions: Array<{ event: RealtimeServerEventName; handler: RealtimeEventHandler }> = [];
  private lifecycleListeners = new Set<(event: RealtimeLifecycleEvent) => void>();

  connect(endpoint: string, token?: string | null): void {
    this.connecting = true;
    const generation = ++this.connectGeneration;

    // Sever any previous socket so only one connection lives at a time, but do
    // NOT clear the registered subscriptions: the caller re-establishes them on
    // the new socket once `loadSocketIo()` resolves.
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }

    void loadSocketIo()
      .then(({ io }) => {
        if (generation !== this.connectGeneration || !this.connecting) {
          return;
        }
        const socket = io(endpoint, {
          autoConnect: false,
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 500,
          reconnectionDelayMax: 2000,
          auth: token ? { token } : undefined,
        });
        this.socket = socket;

        socket.on('connect', () => {
          if (token) {
            socket.emit('session:hello', { token });
          }
          this.lifecycleListeners.forEach((listener) => listener({ kind: 'connect' }));
        });
        socket.on('disconnect', (reason) => {
          this.lifecycleListeners.forEach((listener) => listener({ kind: 'disconnect', reason }));
        });
        socket.io.on('reconnect', () => {
          this.lifecycleListeners.forEach((listener) => listener({ kind: 'reconnect' }));
        });

        for (const subscription of this.subscriptions) {
          socket.on(subscription.event, subscription.handler);
        }
        socket.connect();
      })
      .catch(() => {
        if (generation === this.connectGeneration) {
          this.connecting = false;
        }
      });
  }

  subscribe<E extends RealtimeEnvelope<unknown>>(
    event: RealtimeServerEventName,
    handler: (envelope: E) => void,
  ): void {
    const subscription = {
      event,
      handler: handler as RealtimeEventHandler,
    };
    this.subscriptions.push(subscription);
    this.socket?.on(subscription.event, subscription.handler);
  }

  unsubscribe<E extends RealtimeEnvelope<unknown>>(
    event: RealtimeServerEventName,
    handler: (envelope: E) => void,
  ): void {
    this.subscriptions = this.subscriptions.filter(
      (subscription) => !(subscription.event === event && subscription.handler === (handler as RealtimeEventHandler)),
    );
    this.socket?.off(event, handler as RealtimeEventHandler);
  }

  onLifecycle(listener: (event: RealtimeLifecycleEvent) => void): () => void {
    this.lifecycleListeners.add(listener);
    return () => {
      this.lifecycleListeners.delete(listener);
    };
  }

  /** Clears every application listener and drops the connection (logout/user switch/unmount). */
  disconnect(): void {
    this.connectGeneration += 1;
    this.connecting = false;
    if (!this.socket) {
      return;
    }
    for (const subscription of this.subscriptions) {
      this.socket.off(subscription.event, subscription.handler);
    }
    this.subscriptions = [];
    this.socket.disconnect();
    this.socket = undefined;
  }
}

export const realtimeClient = new RealtimeClient();