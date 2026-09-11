import { HttpResponse, http } from 'msw';
import {
  addEthAmounts,
  compareEthAmounts,
  ethAmount,
  isEthAmount,
  multiplyEthAmount,
  percentageOfEthAmount,
  subtractEthAmounts,
} from '@/lib/money/eth';
import {
  createSession,
  getMockDatabase,
  getOrCreateCart,
  getSession,
  idempotencyScopeKey,
  mergeGuestCartIntoUser,
  nextId,
  persistMockDatabase,
  removeSession,
} from '@/mocks/database/mock-database';
import { hashPassword } from '@/mocks/database/password';
import { getMockScenario } from '@/mocks/scenarios';
import type {
  AuthResponse,
  CartItemResponse,
  CartResponse,
  CatalogResponse,
  FavoritesResponse,
  OrderResponse,
  ProfileResponse,
  QuoteResponse,
  RegisterResponse,
  SessionResponse,
  WalletResponse,
  WalletsResponse,
} from '@/types/api';
import type { CartItem, Order, OrderStatus, Quote, QuoteItem, Wallet } from '@/types/domain';
import {
  apiError,
  asNonEmptyString,
  asPositiveInteger,
  asRecord,
  requestGuestId,
  requestOwnerId,
  requireUserId,
  scenarioResponse,
} from '@/mocks/handlers/utils';

const API = '*/api';
const FIXED_DATE = '2026-01-15T00:00:00.000Z';
const NETWORK_FEE = ethAmount('0.003');

function unauthorized() {
  return apiError(401, 'unauthorized', 'Authentication is required for this resource.');
}

function getNftAndEdition(nftId: string, editionId: string) {
  const nft = getMockDatabase().nfts.find((item) => item.id === nftId);
  const edition = nft?.editions.find((item) => item.id === editionId);
  return { nft, edition };
}

function removePurchasedItems(order: Order) {
  const cart = getOrCreateCart(`user:${order.ownerId}`);
  for (const orderItem of order.items) {
    const cartItem = cart.items.find(
      (item) => item.nftId === orderItem.nftId && item.editionId === orderItem.editionId,
    );
    if (!cartItem) {
      continue;
    }
    if (cartItem.quantity <= orderItem.quantity) {
      cart.items = cart.items.filter((item) => item.id !== cartItem.id);
    } else {
      cartItem.quantity -= orderItem.quantity;
    }
  }
}

function transitionOrderForScenario(order: Order) {
  if (order.status !== 'pending') {
    return;
  }

  const scenario = getMockScenario();
  const nextStatus: OrderStatus | undefined =
    scenario === 'payment-confirmed' ? 'confirmed' : scenario === 'payment-rejected' ? 'rejected' : undefined;
  if (!nextStatus) {
    return;
  }

  order.status = nextStatus;
  order.updatedAt = FIXED_DATE;
  if (nextStatus === 'confirmed') {
    removePurchasedItems(order);
  }
}

function orderFingerprint(quoteId: string) {
  return JSON.stringify({ quoteId });
}

function revalidateQuoteCoupon(quote: Quote) {
  if (!quote.couponCode) {
    return undefined;
  }

  const coupon = getMockDatabase().coupons.find((item) => item.code === quote.couponCode);
  if (!coupon) {
    return apiError(400, 'coupon_invalid', 'Coupon is invalid.');
  }
  if (coupon.expiresAt && coupon.expiresAt < FIXED_DATE) {
    return apiError(400, 'coupon_expired', 'Coupon is expired.');
  }
  return undefined;
}

export const domainHandlers = [
  http.post(`${API}/auth/register`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const body = asRecord(await request.json());
    const email = asNonEmptyString(body?.email)?.toLowerCase();
    const displayName = asNonEmptyString(body?.displayName);
    const password = asNonEmptyString(body?.password);
    if (!email || !displayName || !password || password.length < 8) {
      return apiError(400, 'validation_error', 'Registration fields are invalid.');
    }
    const database = getMockDatabase();
    if (database.users.some((user) => user.email === email)) {
      return apiError(409, 'conflict', 'An account already uses this email.', { email: 'Already registered.' });
    }
    const id = nextId('user');
    const user = { id, email, displayName, passwordHash: hashPassword(password) };
    database.users.push(user);
    database.favoritesByUser.set(id, []);
    database.profilesByUser.set(id, { userId: id, displayName, bio: '', avatarUrl: '' });
    database.walletsByUser.set(id, []);
    persistMockDatabase();
    return HttpResponse.json<RegisterResponse>({ user: { id, email, displayName } }, { status: 201 });
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const body = asRecord(await request.json());
    const email = asNonEmptyString(body?.email)?.toLowerCase();
    const password = asNonEmptyString(body?.password);
    const user = getMockDatabase().users.find((candidate) => candidate.email === email);
    if (!user || !password || user.passwordHash !== hashPassword(password)) {
      return apiError(401, 'unauthorized', 'Invalid email or password.');
    }
    const guestId = requestGuestId(request);
    if (guestId) {
      mergeGuestCartIntoUser(guestId, user.id);
    }
    persistMockDatabase();
    return HttpResponse.json<AuthResponse>({ session: createSession(user.id) });
  }),

  http.get(`${API}/auth/session`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const session = getSession(token);
    return session ? HttpResponse.json<SessionResponse>({ session }) : unauthorized();
  }),

  http.post(`${API}/auth/logout`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!getSession(token)) return unauthorized();
    removeSession(token);
    persistMockDatabase();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/nfts`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const url = new URL(request.url);
    const query = url.searchParams;
    const page = Math.max(1, Number.parseInt(query.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(query.get('pageSize') ?? '12', 10) || 12));
    const search = query.get('search')?.trim().toLowerCase();
    const category = query.get('category')?.trim().toLowerCase();
    const creator = query.get('creator')?.trim().toLowerCase();
    const minPrice = query.get('minPrice');
    const maxPrice = query.get('maxPrice');
    const network = query.get('network')?.trim().toLowerCase();
    let items = getMockScenario() === 'empty-catalog' ? [] : [...getMockDatabase().nfts];
    if (search) {
      items = items.filter((nft) => `${nft.name} ${nft.collection} ${nft.creator}`.toLowerCase().includes(search));
    }
    if (category) items = items.filter((nft) => nft.category.toLowerCase() === category);
    if (creator) items = items.filter((nft) => nft.creator.toLowerCase() === creator);
    if (network) items = items.filter((nft) => nft.network === network);
    if (minPrice && isEthAmount(minPrice)) {
      items = items.filter((nft) => compareEthAmounts(nft.price, minPrice) >= 0);
    }
    if (maxPrice && isEthAmount(maxPrice)) {
      items = items.filter((nft) => compareEthAmounts(nft.price, maxPrice) <= 0);
    }
    const sort = query.get('sort');
    if (sort === 'price-asc') items.sort((left, right) => compareEthAmounts(left.price, right.price));
    if (sort === 'price-desc') items.sort((left, right) => compareEthAmounts(right.price, left.price));
    if (sort === 'name-asc') items.sort((left, right) => left.name.localeCompare(right.name));
    const total = items.length;
    const response: CatalogResponse = {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
    return HttpResponse.json(response);
  }),

  http.get(`${API}/nfts/:nftId`, async ({ request, params }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const nft = getMockDatabase().nfts.find((item) => item.id === params.nftId);
    return nft ? HttpResponse.json(nft) : apiError(404, 'not_found', 'NFT was not found.');
  }),

  http.get(`${API}/favorites`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    return HttpResponse.json<FavoritesResponse>({ items: getMockDatabase().favoritesByUser.get(userId) ?? [] });
  }),

  http.post(`${API}/favorites`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    const body = asRecord(await request.json());
    const nftId = asNonEmptyString(body?.nftId);
    if (!nftId || !getMockDatabase().nfts.some((nft) => nft.id === nftId)) {
      return apiError(404, 'not_found', 'NFT was not found.');
    }
    const favorites = getMockDatabase().favoritesByUser.get(userId) ?? [];
    if (!favorites.some((favorite) => favorite.nftId === nftId)) {
      favorites.push({ nftId, createdAt: FIXED_DATE });
      getMockDatabase().favoritesByUser.set(userId, favorites);
    }
    persistMockDatabase();
    return HttpResponse.json<FavoritesResponse>({ items: favorites }, { status: 201 });
  }),

  http.delete(`${API}/favorites/:nftId`, async ({ request, params }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    const favorites = getMockDatabase().favoritesByUser.get(userId) ?? [];
    getMockDatabase().favoritesByUser.set(userId, favorites.filter((item) => item.nftId !== params.nftId));
    persistMockDatabase();
    return HttpResponse.json<FavoritesResponse>({ items: getMockDatabase().favoritesByUser.get(userId) ?? [] });
  }),

  http.get(`${API}/cart`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    return HttpResponse.json<CartResponse>({ cart: getOrCreateCart(requestOwnerId(request)) });
  }),

  http.post(`${API}/cart/items`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const body = asRecord(await request.json());
    const nftId = asNonEmptyString(body?.nftId);
    const editionId = asNonEmptyString(body?.editionId);
    const quantity = asPositiveInteger(body?.quantity);
    if (!nftId || !editionId || !quantity) return apiError(400, 'validation_error', 'Cart item is invalid.');
    const { nft, edition } = getNftAndEdition(nftId, editionId);
    if (!nft || !edition) return apiError(404, 'not_found', 'NFT edition was not found.');
    if (quantity > edition.available || quantity > edition.maxPerOrder) {
      return apiError(409, 'availability_conflict', 'Requested quantity is unavailable.');
    }
    const cart = getOrCreateCart(requestOwnerId(request));
    const existing = cart.items.find((item) => item.nftId === nftId && item.editionId === editionId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > edition.available || nextQuantity > edition.maxPerOrder) {
      return apiError(409, 'availability_conflict', 'Requested quantity is unavailable.');
    }
    const item: CartItem = existing ?? { id: nextId('cartItem'), nftId, editionId, quantity: 0 };
    item.quantity = nextQuantity;
    if (!existing) cart.items.push(item);
    persistMockDatabase();
    return HttpResponse.json<CartItemResponse>({ item }, { status: 201 });
  }),

  http.patch(`${API}/cart/items/:itemId`, async ({ request, params }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const body = asRecord(await request.json());
    const quantity = asPositiveInteger(body?.quantity);
    if (!quantity) return apiError(400, 'validation_error', 'Quantity must be a positive integer.');
    const cart = getOrCreateCart(requestOwnerId(request));
    const item = cart.items.find((candidate) => candidate.id === params.itemId);
    if (!item) return apiError(404, 'not_found', 'Cart item was not found.');
    const { edition } = getNftAndEdition(item.nftId, item.editionId);
    if (!edition || quantity > edition.available || quantity > edition.maxPerOrder) {
      return apiError(409, 'availability_conflict', 'Requested quantity is unavailable.');
    }
    item.quantity = quantity;
    persistMockDatabase();
    return HttpResponse.json<CartItemResponse>({ item });
  }),

  http.delete(`${API}/cart/items/:itemId`, async ({ request, params }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const cart = getOrCreateCart(requestOwnerId(request));
    cart.items = cart.items.filter((item) => item.id !== params.itemId);
    persistMockDatabase();
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${API}/cart`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    getOrCreateCart(requestOwnerId(request)).items = [];
    persistMockDatabase();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API}/quote`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const ownerId = requestOwnerId(request);
    const body = asRecord(await request.json());
    const couponCode = asNonEmptyString(body?.couponCode)?.toUpperCase();
    const cart = getOrCreateCart(ownerId);
    const quoteItems: QuoteItem[] = [];
    for (const cartItem of cart.items) {
      const { nft, edition } = getNftAndEdition(cartItem.nftId, cartItem.editionId);
      if (!nft || !edition || cartItem.quantity > edition.available) {
        return apiError(409, 'availability_conflict', 'An item in the cart is unavailable.');
      }
      quoteItems.push({
        cartItemId: cartItem.id,
        nftId: cartItem.nftId,
        editionId: cartItem.editionId,
        quantity: cartItem.quantity,
        unitPrice: nft.price,
        total: multiplyEthAmount(nft.price, cartItem.quantity),
      });
    }
    let discountPercent = 0;
    if (couponCode) {
      const coupon = getMockDatabase().coupons.find((item) => item.code === couponCode);
      if (getMockScenario() === 'coupon-rejected' || !coupon) {
        return apiError(400, 'coupon_invalid', 'Coupon is invalid.');
      }
      if (coupon.expiresAt && coupon.expiresAt < FIXED_DATE) {
        return apiError(400, 'coupon_expired', 'Coupon is expired.');
      }
      discountPercent = coupon.discountPercent;
    }
    if (getMockScenario() === 'coupon-accepted' && !couponCode) {
      discountPercent = 10;
    }
    const subtotal = addEthAmounts(...quoteItems.map((item) => item.total));
    const discount = percentageOfEthAmount(subtotal, discountPercent);
    const networkFee = quoteItems.length ? NETWORK_FEE : ethAmount('0');
    const quote: Quote = {
      id: nextId('quote'),
      ownerId,
      items: quoteItems,
      ...(couponCode ? { couponCode } : {}),
      subtotal,
      discount,
      networkFee,
      total: addEthAmounts(subtractEthAmounts(subtotal, discount), networkFee),
      createdAt: FIXED_DATE,
    };
    getMockDatabase().quotes.set(quote.id, quote);
    persistMockDatabase();
    return HttpResponse.json<QuoteResponse>({ quote });
  }),

  http.post(`${API}/orders`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    const body = asRecord(await request.json());
    const quoteId = asNonEmptyString(body?.quoteId);
    const idempotencyKey = asNonEmptyString(request.headers.get('idempotency-key'));
    if (!quoteId || !idempotencyKey) return apiError(400, 'validation_error', 'Quote and idempotency key are required.');
    const scopedKey = idempotencyScopeKey(userId, idempotencyKey);
    const fingerprint = orderFingerprint(quoteId);
    const existing = getMockDatabase().idempotencyKeys.get(scopedKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        return apiError(409, 'conflict', 'Idempotency key was used with a different request.');
      }
      const order = getMockDatabase().orders.get(existing.orderId);
      return order ? HttpResponse.json<OrderResponse>({ order }) : apiError(500, 'server_error', 'Order recovery failed.');
    }
    const quote = getMockDatabase().quotes.get(quoteId);
    if (!quote) return apiError(404, 'not_found', 'Quote was not found.');
    if (quote.ownerId !== `user:${userId}`) return apiError(403, 'forbidden', 'Quote belongs to another user.');
    const couponError = revalidateQuoteCoupon(quote);
    if (couponError) return couponError;
    for (const item of quote.items) {
      const { nft, edition } = getNftAndEdition(item.nftId, item.editionId);
      if (!nft || !edition || item.quantity > edition.available) {
        return apiError(409, 'availability_conflict', 'Quote contains an unavailable item.');
      }
      if (compareEthAmounts(nft.price, item.unitPrice) !== 0) {
        return apiError(409, 'stale_quote', 'Quote no longer matches the current price.');
      }
    }
    const order: Order = {
      id: nextId('order'),
      ownerId: userId,
      status: 'pending',
      items: quote.items.map((item) => {
        const nft = getMockDatabase().nfts.find((candidate) => candidate.id === item.nftId)!;
        return {
          nftId: item.nftId,
          editionId: item.editionId,
          name: nft.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        };
      }),
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      transactionReference: `sim-${quote.id}`,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    };
    getMockDatabase().orders.set(order.id, order);
    getMockDatabase().idempotencyKeys.set(scopedKey, { userId, fingerprint, orderId: order.id });
    persistMockDatabase();
    if (getMockScenario() === 'order-timeout' && !getMockDatabase().timedOutOrderKeys.has(scopedKey)) {
      getMockDatabase().timedOutOrderKeys.add(scopedKey);
      return apiError(504, 'server_error', 'Order was created but the response timed out.');
    }
    return HttpResponse.json<OrderResponse>({ order }, { status: 201 });
  }),

  http.get(`${API}/orders/:orderId`, async ({ request, params }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    const order = getMockDatabase().orders.get(String(params.orderId));
    if (!order) return apiError(404, 'not_found', 'Order was not found.');
    if (order.ownerId !== userId) return apiError(403, 'forbidden', 'Order belongs to another user.');
    transitionOrderForScenario(order);
    return HttpResponse.json<OrderResponse>({ order });
  }),

  http.get(`${API}/profile`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    return HttpResponse.json<ProfileResponse>({ profile: getMockDatabase().profilesByUser.get(userId)! });
  }),

  http.patch(`${API}/profile`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    const body = asRecord(await request.json());
    const profile = getMockDatabase().profilesByUser.get(userId)!;
    const displayName = body?.displayName === undefined ? undefined : asNonEmptyString(body.displayName);
    if (body?.displayName !== undefined && !displayName) {
      return apiError(400, 'validation_error', 'Display name cannot be empty.', { displayName: 'Required.' });
    }
    if (displayName) {
      profile.displayName = displayName;
      const user = getMockDatabase().users.find((candidate) => candidate.id === userId)!;
      user.displayName = displayName;
      for (const session of getMockDatabase().sessions.values()) {
        if (session.userId === userId) session.user.displayName = displayName;
      }
    }
    if (typeof body?.bio === 'string') profile.bio = body.bio;
    if (typeof body?.avatarUrl === 'string') profile.avatarUrl = body.avatarUrl;
    persistMockDatabase();
    return HttpResponse.json<ProfileResponse>({ profile });
  }),

  http.patch(`${API}/profile/password`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    const body = asRecord(await request.json());
    const currentPassword = asNonEmptyString(body?.currentPassword);
    const newPassword = asNonEmptyString(body?.newPassword);
    const user = getMockDatabase().users.find((candidate) => candidate.id === userId)!;
    if (!currentPassword || user.passwordHash !== hashPassword(currentPassword)) {
      return apiError(400, 'validation_error', 'Current password is invalid.');
    }
    if (!newPassword || newPassword.length < 8) {
      return apiError(400, 'validation_error', 'New password must contain at least eight characters.');
    }
    user.passwordHash = hashPassword(newPassword);
    persistMockDatabase();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/wallets`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    return HttpResponse.json<WalletsResponse>({ items: getMockDatabase().walletsByUser.get(userId) ?? [] });
  }),

  http.post(`${API}/wallets`, async ({ request }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    const body = asRecord(await request.json());
    const label = asNonEmptyString(body?.label);
    const address = asNonEmptyString(body?.address);
    const network = body?.network === 'ethereum' || body?.network === 'polygon' ? body.network : undefined;
    if (!label || !address || !network || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return apiError(400, 'validation_error', 'Wallet fields are invalid.');
    }
    const wallets = getMockDatabase().walletsByUser.get(userId) ?? [];
    if (wallets.some((wallet) => wallet.address.toLowerCase() === address.toLowerCase())) {
      return apiError(409, 'conflict', 'Wallet is already registered.');
    }
    const isPrimary = body?.isPrimary === true || wallets.length === 0;
    if (isPrimary) wallets.forEach((wallet) => (wallet.isPrimary = false));
    const wallet: Wallet = { id: nextId('wallet'), label, address, network, isPrimary };
    wallets.push(wallet);
    getMockDatabase().walletsByUser.set(userId, wallets);
    persistMockDatabase();
    return HttpResponse.json<WalletResponse>({ wallet }, { status: 201 });
  }),

  http.patch(`${API}/wallets/:walletId`, async ({ request, params }) => {
    const scenario = await scenarioResponse(request);
    if (scenario) return scenario;
    const userId = requireUserId(request);
    if (!userId) return unauthorized();
    const wallets = getMockDatabase().walletsByUser.get(userId) ?? [];
    const wallet = wallets.find((item) => item.id === params.walletId);
    if (!wallet) return apiError(404, 'not_found', 'Wallet was not found.');
    const body = asRecord(await request.json());
    if (body?.label !== undefined) {
      const label = asNonEmptyString(body.label);
      if (!label) return apiError(400, 'validation_error', 'Wallet label is invalid.');
      wallet.label = label;
    }
    if (body?.network === 'ethereum' || body?.network === 'polygon') wallet.network = body.network;
    if (body?.isPrimary === true) {
      wallets.forEach((item) => (item.isPrimary = item.id === wallet.id));
    }
    persistMockDatabase();
    return HttpResponse.json<WalletResponse>({ wallet });
  }),
];
