import { ethAmount } from '@/lib/money/eth';
import { seedCoupons, seedNfts, seedUsers, seedWallets, type SeedUser } from '@/mocks/fixtures/seed';
import type { MockScenarioName } from '@/mocks/scenarios/types';
import type { Cart, CollectorProfile, Favorite, Nft, Order, Quote, Session, Wallet } from '@/types/domain';

export interface StoredSession extends Session {
  userId: string;
}

export interface IdempotencyRecord {
  userId: string;
  fingerprint: string;
  orderId: string;
}

export interface MockDatabase {
  users: SeedUser[];
  sessions: Map<string, StoredSession>;
  nfts: Nft[];
  favoritesByUser: Map<string, Favorite[]>;
  cartsByOwner: Map<string, Cart>;
  profilesByUser: Map<string, CollectorProfile>;
  walletsByUser: Map<string, Wallet[]>;
  coupons: typeof seedCoupons;
  quotes: Map<string, Quote>;
  orders: Map<string, Order>;
  idempotencyKeys: Map<string, IdempotencyRecord>;
  timedOutOrderKeys: Set<string>;
  counters: Record<'session' | 'cartItem' | 'quote' | 'order' | 'wallet' | 'user', number>;
}

const FIXED_DATE = '2026-01-15T00:00:00.000Z';

const PERSISTENCE_KEY = 'kurio-mock-db:v1';

/**
 * The browser mock database lives in page scope, so a full navigation or a
 * refresh re-runs its module and would silently reset every cart, session and
 * scenario. A real backend would not forget the server state on a page reload,
 * so the mock layer persists a serialized snapshot in sessionStorage (per
 * origin + tab) and rehydrates it when the module boots again.
 *
 * The persistence is gated to real browsers: the node/jsdom environments used
 * by unit and integration tests do not feature a service worker and keep their
 * clean, deterministic per-test databases.
 */
function canUsePersistentStore() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

function mapEntries<V>(map: Map<string, V>) {
  return Array.from(map.entries());
}

export function persistMockDatabase() {
  if (!canUsePersistentStore()) {
    return;
  }
  try {
    const { mockDatabase: database } = { mockDatabase: getMockDatabase() };
    const snapshot = JSON.stringify({
      users: database.users,
      sessions: mapEntries(database.sessions),
      nfts: database.nfts,
      favoritesByUser: mapEntries(database.favoritesByUser),
      cartsByOwner: mapEntries(database.cartsByOwner),
      profilesByUser: mapEntries(database.profilesByUser),
      walletsByUser: mapEntries(database.walletsByUser),
      coupons: database.coupons,
      quotes: mapEntries(database.quotes),
      orders: mapEntries(database.orders),
      idempotencyKeys: mapEntries(database.idempotencyKeys),
      timedOutOrderKeys: Array.from(database.timedOutOrderKeys),
      counters: database.counters,
    });
    window.sessionStorage.setItem(PERSISTENCE_KEY, snapshot);
  } catch {
    // Persistence is best-effort; an unavailable store never breaks the mock.
  }
}

function restorePersistedDatabase(): MockDatabase | undefined {
  if (!canUsePersistentStore()) {
    return undefined;
  }
  try {
    const raw = window.sessionStorage.getItem(PERSISTENCE_KEY);
    if (!raw) {
      return undefined;
    }
    const data = JSON.parse(raw) as {
      users: MockDatabase['users'];
      sessions: [string, StoredSession][];
      nfts: MockDatabase['nfts'];
      favoritesByUser: [string, MockDatabase['favoritesByUser'] extends Map<string, infer V> ? V : never][];
      cartsByOwner: [string, MockDatabase['cartsByOwner'] extends Map<string, infer V> ? V : never][];
      profilesByUser: [string, MockDatabase['profilesByUser'] extends Map<string, infer V> ? V : never][];
      walletsByUser: [string, MockDatabase['walletsByUser'] extends Map<string, infer V> ? V : never][];
      coupons: MockDatabase['coupons'];
      quotes: [string, MockDatabase['quotes'] extends Map<string, infer V> ? V : never][];
      orders: [string, MockDatabase['orders'] extends Map<string, infer V> ? V : never][];
      idempotencyKeys: [string, MockDatabase['idempotencyKeys'] extends Map<string, infer V> ? V : never][];
      timedOutOrderKeys: string[];
      counters: MockDatabase['counters'];
    };
    return {
      users: data.users,
      sessions: new Map(data.sessions),
      nfts: data.nfts,
      favoritesByUser: new Map(data.favoritesByUser),
      cartsByOwner: new Map(data.cartsByOwner),
      profilesByUser: new Map(data.profilesByUser),
      walletsByUser: new Map(data.walletsByUser),
      coupons: data.coupons,
      quotes: new Map(data.quotes),
      orders: new Map(data.orders),
      idempotencyKeys: new Map(data.idempotencyKeys),
      timedOutOrderKeys: new Set(data.timedOutOrderKeys),
      counters: data.counters,
    };
  } catch {
    return undefined;
  }
}

export function clearPersistedDatabase() {
  if (!canUsePersistentStore()) {
    return;
  }
  try {
    window.sessionStorage.removeItem(PERSISTENCE_KEY);
  } catch {
    // ignore
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function userOwnerKey(userId: string) {
  return `user:${userId}`;
}

export function guestOwnerKey(guestId: string) {
  return `guest:${guestId}`;
}

export function idempotencyScopeKey(userId: string, key: string) {
  return `user:${userId}:${key}`;
}

function createSeededDatabase(): MockDatabase {
  const users = clone(seedUsers);
  const cartsByOwner = new Map<string, Cart>([
    [
      userOwnerKey('user-ada'),
      {
        id: 'cart-user-ada',
        ownerId: userOwnerKey('user-ada'),
        items: [
          { id: 'cart-item-ada-aurora', nftId: 'nft-aurora', editionId: 'aurora-standard', quantity: 1 },
          { id: 'cart-item-ada-tide', nftId: 'nft-tide', editionId: 'tide-open', quantity: 1 },
        ],
      },
    ],
    [userOwnerKey('user-lin'), { id: 'cart-user-lin', ownerId: userOwnerKey('user-lin'), items: [] }],
    [
      guestOwnerKey('default'),
      {
        id: 'cart-guest-default',
        ownerId: guestOwnerKey('default'),
        items: [{ id: 'cart-item-guest-tide', nftId: 'nft-tide', editionId: 'tide-open', quantity: 1 }],
      },
    ],
  ]);

  return {
    users,
    sessions: new Map(),
    nfts: clone(seedNfts),
    favoritesByUser: new Map([
      ['user-ada', [{ nftId: 'nft-aurora', createdAt: FIXED_DATE }]],
      ['user-lin', []],
    ]),
    cartsByOwner,
    profilesByUser: new Map(
      users.map((user) => [
        user.id,
        {
          userId: user.id,
          displayName: user.displayName,
          bio: `${user.displayName}'s fictional Kurio collection.`,
          avatarUrl: `https://example.test/avatars/${user.id}.png`,
        },
      ]),
    ),
    walletsByUser: new Map(Object.entries(clone(seedWallets))),
    coupons: clone(seedCoupons),
    quotes: new Map(),
    orders: new Map(),
    idempotencyKeys: new Map(),
    timedOutOrderKeys: new Set(),
    counters: { session: 0, cartItem: 0, quote: 0, order: 0, wallet: 0, user: 0 },
  };
}

function createMockDatabase(): MockDatabase {
  return restorePersistedDatabase() ?? createSeededDatabase();
}

let mockDatabase = createMockDatabase();

export function getMockDatabase() {
  return mockDatabase;
}

export function resetMockDatabase() {
  mockDatabase = createSeededDatabase();
  clearPersistedDatabase();
}

export function createSession(userId: string): StoredSession {
  const database = getMockDatabase();
  const user = database.users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new Error(`Cannot create a session for unknown user ${userId}.`);
  }

  database.counters.session += 1;
  const token = `session-${user.id}-${database.counters.session}`;
  const session: StoredSession = {
    token,
    userId: user.id,
    user: { id: user.id, email: user.email, displayName: user.displayName },
    expiresAt: '2026-01-15T12:00:00.000Z',
  };
  database.sessions.set(token, session);
  return session;
}

export function getSession(token: string | undefined) {
  return token ? getMockDatabase().sessions.get(token) : undefined;
}

export function removeSession(token: string | undefined) {
  if (token) {
    getMockDatabase().sessions.delete(token);
  }
}

export function getOrCreateCart(ownerId: string): Cart {
  const database = getMockDatabase();
  const existing = database.cartsByOwner.get(ownerId);
  if (existing) {
    return existing;
  }

  const cart: Cart = { id: `cart-${ownerId.replace(':', '-')}`, ownerId, items: [] };
  database.cartsByOwner.set(ownerId, cart);
  return cart;
}

export function nextId(kind: keyof MockDatabase['counters']) {
  const database = getMockDatabase();
  database.counters[kind] += 1;
  return `${kind}-${database.counters[kind]}`;
}

export function applyMockScenario(scenario: MockScenarioName) {
  const database = getMockDatabase();
  if (scenario === 'sold-out') {
    const edition = database.nfts
      .find((nft) => nft.id === 'nft-aurora')
      ?.editions.find((item) => item.id === 'aurora-standard');
    if (edition) {
      edition.available = 0;
    }
  }

  if (scenario === 'price-changed') {
    const nft = database.nfts.find((item) => item.id === 'nft-aurora');
    if (nft) {
      nft.price = ethAmount('1.5');
      nft.version += 1;
    }
  }
}

export function mergeGuestCartIntoUser(guestId: string, userId: string) {
  const guestCart = getOrCreateCart(guestOwnerKey(guestId));
  const userCart = getOrCreateCart(userOwnerKey(userId));

  for (const guestItem of guestCart.items) {
    const nft = getMockDatabase().nfts.find((candidate) => candidate.id === guestItem.nftId);
    const edition = nft?.editions.find((candidate) => candidate.id === guestItem.editionId);
    if (!edition) {
      continue;
    }

    const cap = Math.min(edition.available, edition.maxPerOrder);
    const existing = userCart.items.find(
      (item) => item.nftId === guestItem.nftId && item.editionId === guestItem.editionId,
    );
    if (existing) {
      existing.quantity = Math.min(existing.quantity + guestItem.quantity, Math.max(existing.quantity, cap));
    } else if (cap > 0) {
      userCart.items.push({
        ...guestItem,
        id: nextId('cartItem'),
        quantity: Math.min(guestItem.quantity, cap),
      });
    }
  }

  guestCart.items = [];
}
