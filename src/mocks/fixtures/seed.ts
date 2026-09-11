import { ethAmount } from '@/lib/money/eth';
import { hashPassword } from '@/mocks/database/password';
import type { Coupon, Nft, NftNetwork, User, Wallet } from '@/types/domain';

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

const ARTWORK_03 = '/assets/nft/nft-artwork-03.png';
const ARTWORK_07 = '/assets/nft/nft-artwork-07.png';
const ARTWORK_08 = '/assets/nft/nft-artwork-08.png';
const ARTWORK_10 = '/assets/nft/nft-artwork-10.png';

function openEdition(id: string, name: string, available: number, maxPerOrder: number) {
  return [{ id, name, available, maxPerOrder }];
}

interface SeedNftInput {
  id: string;
  name: string;
  collection: string;
  creator: string;
  category: string;
  description: string;
  price: string;
  network: NftNetwork;
  imageUrl: string;
  editions: ReturnType<typeof openEdition>;
}

function seedNft(input: SeedNftInput): Nft {
  return {
    ...input,
    price: ethAmount(input.price),
    version: 1,
  };
}

/**
 * Deterministic artwork mapping: the four supplied assets rotate across the
 * seed by visual coherence with each NFT name (green-jacket/sunglasses,
 * purple-hoodie/bucket-hat, cream-suit/turtleneck, golden/headphones).
 */
export const seedNfts: Nft[] = [
  seedNft({
    id: 'nft-aurora',
    name: 'Aurora Signal',
    collection: 'Kurio Genesis',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description: 'A fictional generative light study.',
    price: '1.25',
    network: 'ethereum',
    imageUrl: ARTWORK_10,
    editions: openEdition('aurora-standard', 'Standard', 8, 3).concat(
      openEdition('aurora-signed', 'Signed', 2, 1),
    ),
  }),
  seedNft({
    id: 'nft-tide',
    name: 'Tide Archive',
    collection: 'Kurio Genesis',
    creator: 'Nori Shin',
    category: 'Photography',
    description: 'A fictional archival coastal composition.',
    price: '0.875',
    network: 'ethereum',
    imageUrl: ARTWORK_07,
    editions: openEdition('tide-open', 'Open edition', 15, 5),
  }),
  seedNft({
    id: 'nft-orbit',
    name: 'Orbit Bloom',
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description: 'A fictional orbital botanical study.',
    price: '2.4',
    network: 'ethereum',
    imageUrl: ARTWORK_08,
    editions: openEdition('orbit-collector', 'Collector', 1, 1),
  }),
  seedNft({
    id: 'nft-emerald',
    name: 'Emerald Ape #042',
    collection: 'Kurio Genesis',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description: 'A fictional varsity jungle portrait.',
    price: '1.19',
    network: 'ethereum',
    imageUrl: ARTWORK_03,
    editions: openEdition('emerald-standard', 'Standard', 6, 2),
  }),
  seedNft({
    id: 'nft-sage',
    name: 'Sage Nomad #009',
    collection: 'Kurio Genesis',
    creator: 'Nori Shin',
    category: '3D Art',
    description: 'A fictional wanderer portrait in violet.',
    price: '1.69',
    network: 'polygon',
    imageUrl: ARTWORK_07,
    editions: openEdition('sage-standard', 'Standard', 5, 2),
  }),
  seedNft({
    id: 'nft-neon',
    name: 'Neon Vessel #552',
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description: 'A fictional tailored light study.',
    price: '1.99',
    network: 'ethereum',
    imageUrl: ARTWORK_08,
    editions: openEdition('neon-standard', 'Standard', 4, 2),
  }),
  seedNft({
    id: 'nft-cosmic',
    name: 'Cosmic Blooms #118',
    collection: 'Kurio Editions',
    creator: 'Nori Shin',
    category: 'Photography',
    description: 'A fictional cosmic garden frame.',
    price: '1.29',
    network: 'solana',
    imageUrl: ARTWORK_07,
    editions: openEdition('cosmic-standard', 'Standard', 7, 3),
  }),
  seedNft({
    id: 'nft-violet',
    name: 'Violet Nomad #314',
    collection: 'Kurio Genesis',
    creator: 'Nori Shin',
    category: 'Photography',
    description: 'A fictional nomadic violet portrait.',
    price: '1.39',
    network: 'polygon',
    imageUrl: ARTWORK_07,
    editions: openEdition('violet-standard', 'Standard', 6, 3),
  }),
  seedNft({
    id: 'nft-ivory',
    name: 'Ivory Baron #088',
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description: 'A fictional baronial tailored portrait.',
    price: '1.79',
    network: 'ethereum',
    imageUrl: ARTWORK_08,
    editions: openEdition('ivory-standard', 'Standard', 3, 1),
  }),
  seedNft({
    id: 'nft-golden-beat',
    name: 'Golden Beat #007',
    collection: 'Kurio Sound',
    creator: 'Mina Vale',
    category: 'Music',
    description: 'A fictional golden listening session.',
    price: '0.99',
    network: 'ethereum',
    imageUrl: ARTWORK_10,
    editions: openEdition('beat-standard', 'Standard', 9, 3),
  }),
  seedNft({
    id: 'nft-golden-signal',
    name: 'Golden Signal #160',
    collection: 'Kurio Sound',
    creator: 'Mina Vale',
    category: 'Music',
    description: 'A fictional golden broadcast still.',
    price: '0.39',
    network: 'solana',
    imageUrl: ARTWORK_10,
    editions: openEdition('signal-standard', 'Standard', 12, 4),
  }),
  seedNft({
    id: 'nft-sage-nomad-2',
    name: 'Sage Nomad #010',
    collection: 'Kurio Genesis',
    creator: 'Nori Shin',
    category: 'Collectibles',
    description: 'A second wanderer portrait in violet.',
    price: '1.49',
    network: 'polygon',
    imageUrl: ARTWORK_07,
    editions: openEdition('sage-2-standard', 'Standard', 5, 2),
  }),
  seedNft({
    id: 'nft-neon-vessel-2',
    name: 'Neon Vessel #553',
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: '3D Art',
    description: 'A second tailored light study.',
    price: '1.89',
    network: 'ethereum',
    imageUrl: ARTWORK_08,
    editions: openEdition('neon-2-standard', 'Standard', 4, 2),
  }),
  seedNft({
    id: 'nft-ivory-baron-2',
    name: 'Ivory Baron #089',
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: 'Generative',
    description: 'A second baronial tailored portrait.',
    price: '1.59',
    network: 'polygon',
    imageUrl: ARTWORK_08,
    editions: openEdition('ivory-2-standard', 'Standard', 3, 1),
  }),
  seedNft({
    id: 'nft-golden-beat-2',
    name: 'Golden Beat #008',
    collection: 'Kurio Sound',
    creator: 'Mina Vale',
    category: 'Games',
    description: 'A second golden listening session.',
    price: '0.89',
    network: 'ethereum',
    imageUrl: ARTWORK_10,
    editions: openEdition('beat-2-standard', 'Standard', 9, 3),
  }),
  seedNft({
    id: 'nft-cosmic-blooms-2',
    name: 'Cosmic Blooms #119',
    collection: 'Kurio Editions',
    creator: 'Nori Shin',
    category: 'Utility',
    description: 'A second cosmic garden frame.',
    price: '1.19',
    network: 'solana',
    imageUrl: ARTWORK_07,
    editions: openEdition('cosmic-2-standard', 'Standard', 7, 3),
  }),
  seedNft({
    id: 'nft-kurio-pass',
    name: 'Kurio Pass #001',
    collection: 'Kurio Access',
    creator: 'Nori Shin',
    category: 'Subscriptions',
    description: 'A fictional access pass for Kurio drops.',
    price: '0.49',
    network: 'polygon',
    imageUrl: ARTWORK_07,
    editions: openEdition('pass-standard', 'Standard', 10, 2),
  }),
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
