import type { EthAmount } from '@/lib/money/eth';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Session {
  token: string;
  user: User;
  expiresAt: string;
}

export interface NftEdition {
  id: string;
  name: string;
  available: number;
  maxPerOrder: number;
}

export type NftNetwork = 'ethereum' | 'polygon' | 'solana';

export interface Nft {
  id: string;
  name: string;
  collection: string;
  creator: string;
  category: string;
  description: string;
  price: EthAmount;
  network: NftNetwork;
  imageUrl: string;
  version: number;
  editions: NftEdition[];
}

export interface Favorite {
  nftId: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  nftId: string;
  editionId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  ownerId: string;
  items: CartItem[];
}

export interface Coupon {
  code: string;
  discountPercent: number;
  expiresAt?: string;
}

export interface QuoteItem {
  cartItemId: string;
  nftId: string;
  editionId: string;
  quantity: number;
  unitPrice: EthAmount;
  total: EthAmount;
}

export interface Quote {
  id: string;
  ownerId: string;
  items: QuoteItem[];
  couponCode?: string;
  subtotal: EthAmount;
  discount: EthAmount;
  networkFee: EthAmount;
  total: EthAmount;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'rejected';

export interface OrderItem {
  nftId: string;
  editionId: string;
  name: string;
  quantity: number;
  unitPrice: EthAmount;
  total: EthAmount;
}

export interface Order {
  id: string;
  ownerId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: EthAmount;
  discount: EthAmount;
  networkFee: EthAmount;
  total: EthAmount;
  transactionReference: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectorProfile {
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
}

export interface Wallet {
  id: string;
  label: string;
  address: string;
  network: 'ethereum' | 'polygon';
  isPrimary: boolean;
}
