import type {
  Cart,
  CartItem,
  CollectorProfile,
  Favorite,
  Nft,
  Order,
  Quote,
  Session,
  User,
  Wallet,
} from '@/types/domain';

export interface ApiError {
  error: {
    code:
      | 'validation_error'
      | 'unauthorized'
      | 'forbidden'
      | 'not_found'
      | 'conflict'
      | 'availability_conflict'
      | 'coupon_invalid'
      | 'coupon_expired'
      | 'stale_quote'
      | 'server_error';
    message: string;
    fields?: Record<string, string>;
  };
}

export interface CatalogQuery {
  search?: string;
  category?: string;
  creator?: string;
  sort?: 'name-asc' | 'price-asc' | 'price-desc';
  page?: number;
  pageSize?: number;
}

export interface CatalogResponse {
  items: Nft[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface RegisterInput {
  email: string;
  displayName: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AddCartItemInput {
  nftId: string;
  editionId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface QuoteInput {
  couponCode?: string;
}

export interface CreateOrderInput {
  quoteId: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface CreateWalletInput {
  label: string;
  address: string;
  network: 'ethereum' | 'polygon';
  isPrimary?: boolean;
}

export type UpdateWalletInput = Partial<CreateWalletInput>;

export interface AuthResponse {
  session: Session;
}

export interface SessionResponse {
  session: Session;
}

export interface RegisterResponse {
  user: User;
}

export interface FavoritesResponse {
  items: Favorite[];
}

export interface CartResponse {
  cart: Cart;
}

export interface CartItemResponse {
  item: CartItem;
}

export interface QuoteResponse {
  quote: Quote;
}

export interface OrderResponse {
  order: Order;
}

export interface ProfileResponse {
  profile: CollectorProfile;
}

export interface WalletsResponse {
  items: Wallet[];
}

export interface WalletResponse {
  wallet: Wallet;
}
