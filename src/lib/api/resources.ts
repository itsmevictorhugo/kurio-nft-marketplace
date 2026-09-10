import { apiClient } from '@/lib/axios/api-client';
import type {
  AddCartItemInput,
  AuthResponse,
  CartItemResponse,
  CartResponse,
  CatalogQuery,
  CatalogResponse,
  ChangePasswordInput,
  CreateOrderInput,
  CreateWalletInput,
  FavoritesResponse,
  LoginInput,
  OrderResponse,
  ProfileResponse,
  QuoteInput,
  QuoteResponse,
  RegisterInput,
  RegisterResponse,
  SessionResponse,
  UpdateCartItemInput,
  UpdateProfileInput,
  UpdateWalletInput,
  WalletResponse,
  WalletsResponse,
} from '@/types/api';
import type { Nft } from '@/types/domain';

export interface RequestIdentity {
  token?: string;
  guestId?: string;
}

function identityConfig(identity: RequestIdentity = {}) {
  return {
    headers: {
      ...(identity.token ? { Authorization: `Bearer ${identity.token}` } : {}),
      ...(identity.guestId ? { 'X-Guest-Id': identity.guestId } : {}),
    },
  };
}

export const authApi = {
  async register(input: RegisterInput) {
    return (await apiClient.post<RegisterResponse>('/auth/register', input)).data;
  },
  async login(input: LoginInput, guestId?: string) {
    return (await apiClient.post<AuthResponse>('/auth/login', input, identityConfig({ guestId }))).data;
  },
  async session(token: string) {
    return (await apiClient.get<SessionResponse>('/auth/session', identityConfig({ token }))).data;
  },
  async logout(token: string) {
    await apiClient.post('/auth/logout', undefined, identityConfig({ token }));
  },
};

export const nftApi = {
  async list(query: CatalogQuery = {}) {
    return (await apiClient.get<CatalogResponse>('/nfts', { params: query })).data;
  },
  async get(nftId: string) {
    return (await apiClient.get<Nft>(`/nfts/${nftId}`)).data;
  },
};

export const favoritesApi = {
  async list(token: string) {
    return (await apiClient.get<FavoritesResponse>('/favorites', identityConfig({ token }))).data;
  },
  async add(token: string, nftId: string) {
    return (await apiClient.post<FavoritesResponse>('/favorites', { nftId }, identityConfig({ token }))).data;
  },
  async remove(token: string, nftId: string) {
    return (await apiClient.delete<FavoritesResponse>(`/favorites/${nftId}`, identityConfig({ token }))).data;
  },
};

export const cartApi = {
  async get(identity: RequestIdentity) {
    return (await apiClient.get<CartResponse>('/cart', identityConfig(identity))).data;
  },
  async add(identity: RequestIdentity, input: AddCartItemInput) {
    return (await apiClient.post<CartItemResponse>('/cart/items', input, identityConfig(identity))).data;
  },
  async update(identity: RequestIdentity, itemId: string, input: UpdateCartItemInput) {
    return (await apiClient.patch<CartItemResponse>(`/cart/items/${itemId}`, input, identityConfig(identity))).data;
  },
  async remove(identity: RequestIdentity, itemId: string) {
    await apiClient.delete(`/cart/items/${itemId}`, identityConfig(identity));
  },
  async clear(identity: RequestIdentity) {
    await apiClient.delete('/cart', identityConfig(identity));
  },
};

export const quoteApi = {
  async create(identity: RequestIdentity, input: QuoteInput = {}) {
    return (await apiClient.post<QuoteResponse>('/quote', input, identityConfig(identity))).data;
  },
};

export const ordersApi = {
  async create(token: string, input: CreateOrderInput, idempotencyKey: string) {
    return (
      await apiClient.post<OrderResponse>('/orders', input, {
        headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': idempotencyKey },
      })
    ).data;
  },
  async get(token: string, orderId: string) {
    return (await apiClient.get<OrderResponse>(`/orders/${orderId}`, identityConfig({ token }))).data;
  },
};

export const profileApi = {
  async get(token: string) {
    return (await apiClient.get<ProfileResponse>('/profile', identityConfig({ token }))).data;
  },
  async update(token: string, input: UpdateProfileInput) {
    return (await apiClient.patch<ProfileResponse>('/profile', input, identityConfig({ token }))).data;
  },
  async changePassword(token: string, input: ChangePasswordInput) {
    await apiClient.patch('/profile/password', input, identityConfig({ token }));
  },
};

export const walletsApi = {
  async list(token: string) {
    return (await apiClient.get<WalletsResponse>('/wallets', identityConfig({ token }))).data;
  },
  async create(token: string, input: CreateWalletInput) {
    return (await apiClient.post<WalletResponse>('/wallets', input, identityConfig({ token }))).data;
  },
  async update(token: string, walletId: string, input: UpdateWalletInput) {
    return (await apiClient.patch<WalletResponse>(`/wallets/${walletId}`, input, identityConfig({ token }))).data;
  },
};
