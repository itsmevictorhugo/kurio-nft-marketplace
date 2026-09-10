import { ethAmount } from '@/lib/money/eth';
import { hashPassword } from '@/mocks/database/password';
import type { Coupon, Nft, User, Wallet } from '@/types/domain';

export interface SeedUser extends User {
  passwordHash: string;
}

export const seedUsers: SeedUser[] = [
  {
    id: 'user-ada',
    email: 'ada@kurio.test',
    displayName: 'Ada Collector',
    passwordHash: hashPassword('kurio-ada-2026'),
  },
  {
    id: 'user-lin',
    email: 'lin@kurio.test',
    displayName: 'Lin Collector',
    passwordHash: hashPassword('kurio-lin-2026'),
  },
];

export const seedNfts: Nft[] = [
  {
    id: 'nft-aurora',
    name: 'Aurora Signal',
    collection: 'Kurio Genesis',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description: 'A fictional generative light study.',
    price: ethAmount('1.25'),
    version: 1,
    editions: [
      { id: 'aurora-standard', name: 'Standard', available: 8, maxPerOrder: 3 },
      { id: 'aurora-signed', name: 'Signed', available: 2, maxPerOrder: 1 },
    ],
  },
  {
    id: 'nft-tide',
    name: 'Tide Archive',
    collection: 'Kurio Genesis',
    creator: 'Nori Shin',
    category: 'Photography',
    description: 'A fictional archival coastal composition.',
    price: ethAmount('0.875'),
    version: 1,
    editions: [{ id: 'tide-open', name: 'Open edition', available: 15, maxPerOrder: 5 }],
  },
  {
    id: 'nft-orbit',
    name: 'Orbit Bloom',
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description: 'A fictional orbital botanical study.',
    price: ethAmount('2.4'),
    version: 1,
    editions: [{ id: 'orbit-collector', name: 'Collector', available: 1, maxPerOrder: 1 }],
  },
];

export const seedCoupons: Coupon[] = [
  { code: 'KURIO10', discountPercent: 10 },
  { code: 'ARCHIVE5', discountPercent: 5 },
  { code: 'EXPIRED10', discountPercent: 10, expiresAt: '2020-01-01T00:00:00.000Z' },
];

export const seedWallets: Record<string, Wallet[]> = {
  'user-ada': [
    {
      id: 'wallet-ada-primary',
      label: 'Ada primary',
      address: '0x1111111111111111111111111111111111111111',
      network: 'ethereum',
      isPrimary: true,
    },
    {
      id: 'wallet-ada-secondary',
      label: 'Ada secondary',
      address: '0x2222222222222222222222222222222222222222',
      network: 'polygon',
      isPrimary: false,
    },
  ],
  'user-lin': [
    {
      id: 'wallet-lin-primary',
      label: 'Lin primary',
      address: '0x3333333333333333333333333333333333333333',
      network: 'ethereum',
      isPrimary: true,
    },
  ],
};
