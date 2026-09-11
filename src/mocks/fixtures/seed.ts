import { ethAmount } from '@/lib/money/eth';
import { hashPassword } from '@/mocks/database/password';
import type { Coupon, Nft, NftEdition, NftNetwork, User, Wallet } from '@/types/domain';

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

/**
 * Deterministic collection contract address: an FNV-1a 32-bit fingerprint of
 * (collection, creator) expanded through xorshift into 40 uppercase hex chars.
 * Presentation-only; displayed truncated like `0x7A42…19E8`.
 */
function collectionContract(collection: string, creator: string): string {
  let state = 0x811c9dc5;
  const source = `${collection}·${creator}`;
  for (let index = 0; index < source.length; index += 1) {
    state ^= source.charCodeAt(index);
    state = Math.imul(state, 0x01000193);
  }
  let address = '0x';
  for (let block = 0; block < 5; block += 1) {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    address += state.toString(16).padStart(8, '0').toUpperCase();
  }
  return address;
}

function openEdition(
  id: string,
  name: string,
  available: number,
  maxPerOrder: number,
  total?: number,
  editionNumber?: number,
): NftEdition[] {
  const edition: NftEdition = { id, name, available, maxPerOrder };
  if (total !== undefined) edition.total = total;
  if (editionNumber !== undefined) edition.editionNumber = editionNumber;
  return [edition];
}

interface SeedNftInput {
  id: string;
  name: string;
  tokenId: number;
  collection: string;
  creator: string;
  category: string;
  description: string;
  price: string;
  network: NftNetwork;
  imageUrl: string;
  attributes: string[];
  editions: ReturnType<typeof openEdition>;
}

function seedNft(input: SeedNftInput): Nft {
  return {
    ...input,
    price: ethAmount(input.price),
    version: 1,
    contract: collectionContract(input.collection, input.creator),
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
    tokenId: 101,
    collection: 'Kurio Genesis',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description:
      'Um estudo generativo de luz, finalizado à mão por Mina Vale e verificado na Ethereum. A obra inclui arte em alta resolução desbloqueável para colecionadores.',
    price: '1.25',
    network: 'ethereum',
    imageUrl: ARTWORK_10,
    attributes: ['Iluminação', 'Generativo', 'Raro'],
    editions: openEdition('aurora-standard', 'Standard', 8, 3, 18, 1).concat(
      openEdition('aurora-signed', 'Signed', 2, 1, 2, 1),
    ),
  }),
  seedNft({
    id: 'nft-tide',
    name: 'Tide Archive',
    tokenId: 88,
    collection: 'Kurio Genesis',
    creator: 'Nori Shin',
    category: 'Photography',
    description:
      'Uma composição costeira de arquivo de Nori Shin, finalizada à mão e verificada na Ethereum. Edição aberta com arte em alta resolução e procedência imutável.',
    price: '0.875',
    network: 'ethereum',
    imageUrl: ARTWORK_07,
    attributes: ['Fotografia', 'Arquivo costeiro', 'Edição aberta'],
    editions: openEdition('tide-open', 'Open edition', 15, 5),
  }),
  seedNft({
    id: 'nft-orbit',
    name: 'Orbit Bloom',
    tokenId: 1,
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description:
      'Uma peça orbital-botânica única de Mina Vale, finalizada à mão e verificada na Ethereum. O estudo 1/1 acompanha metadados armazenados no IPFS.',
    price: '2.4',
    network: 'ethereum',
    imageUrl: ARTWORK_08,
    attributes: ['Orbital', 'Botânica', 'Edição única'],
    editions: openEdition('orbit-collector', 'Collector', 1, 1, 1, 1),
  }),
  seedNft({
    id: 'nft-emerald',
    name: 'Emerald Ape #042',
    tokenId: 842,
    collection: 'Kurio Genesis',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description:
      'Um colecionável digital finalizado à mão da coleção Kurio Genesis, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.',
    price: '1.19',
    network: 'ethereum',
    imageUrl: ARTWORK_03,
    attributes: ['Óculos', 'Esmeralda', 'Raro'],
    editions: openEdition('emerald-standard', 'Standard', 6, 2, 58, 1),
  }),
  seedNft({
    id: 'nft-sage',
    name: 'Sage Nomad #009',
    tokenId: 9,
    collection: 'Kurio Genesis',
    creator: 'Nori Shin',
    category: '3D Art',
    description:
      'Um retrato nômade de Nori Shin, finalizado à mão em violeta e verificado na Polygon. A peça explora a identidade de quem caminha sem fronteiras.',
    price: '1.69',
    network: 'polygon',
    imageUrl: ARTWORK_07,
    attributes: ['Capuz', 'Violeta', 'Nômade'],
    editions: openEdition('sage-standard', 'Standard', 5, 2, 50, 1),
  }),
  seedNft({
    id: 'nft-neon',
    name: 'Neon Vessel #552',
    tokenId: 552,
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description:
      'Um estudo de alfaiataria e néon de Mina Vale, verificado na Ethereum. Cada atributo é registrado nos metadados do token.',
    price: '1.99',
    network: 'ethereum',
    imageUrl: ARTWORK_08,
    attributes: ['Neon', 'Alfaiataria', 'Estúdio'],
    editions: openEdition('neon-standard', 'Standard', 4, 2, 30, 1),
  }),
  seedNft({
    id: 'nft-cosmic',
    name: 'Cosmic Blooms #118',
    tokenId: 118,
    collection: 'Kurio Editions',
    creator: 'Nori Shin',
    category: 'Photography',
    description:
      'Um jardim cósmico de Nori Shin, finalizado à mão e verificado na Solana. Uma moldura de luz e cor para colecionadores do mundo todo.',
    price: '1.29',
    network: 'solana',
    imageUrl: ARTWORK_07,
    attributes: ['Flor', 'Cósmico', 'Fotografia'],
    editions: openEdition('cosmic-standard', 'Standard', 7, 3, 40, 1),
  }),
  seedNft({
    id: 'nft-violet',
    name: 'Violet Nomad #314',
    tokenId: 314,
    collection: 'Kurio Genesis',
    creator: 'Nori Shin',
    category: 'Photography',
    description:
      'Um retrato nômade de Nori Shin em tons de lavanda, verificado na Polygon. A obra acompanha arte em alta resolução e acesso a lançamentos.',
    price: '1.39',
    network: 'polygon',
    imageUrl: ARTWORK_07,
    attributes: ['Lavanda', 'Nômade', 'Raro'],
    editions: openEdition('violet-standard', 'Standard', 6, 3, 45, 1),
  }),
  seedNft({
    id: 'nft-ivory',
    name: 'Ivory Baron #088',
    tokenId: 88,
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: 'Digital Art',
    description:
      'Um retrato baronial de Mina Vale, finalizado à mão em marfim e verificado na Ethereum. A peça é de tiragem limitada e muito procurada.',
    price: '1.79',
    network: 'ethereum',
    imageUrl: ARTWORK_08,
    attributes: ['Marfim', 'Alfaiataria', 'Nobre'],
    editions: openEdition('ivory-standard', 'Standard', 3, 1, 25, 1),
  }),
  seedNft({
    id: 'nft-golden-beat',
    name: 'Golden Beat #007',
    tokenId: 7,
    collection: 'Kurio Sound',
    creator: 'Mina Vale',
    category: 'Music',
    description:
      'Uma sessão de escuta em dourado de Mina Vale, verificada na Ethereum. A obra desbloqueia faixas e conteúdo exclusivo para colecionadores.',
    price: '0.99',
    network: 'ethereum',
    imageUrl: ARTWORK_10,
    attributes: ['Dourado', 'Fones', 'Música'],
    editions: openEdition('beat-standard', 'Standard', 9, 3, 40, 1),
  }),
  seedNft({
    id: 'nft-golden-signal',
    name: 'Golden Signal #160',
    tokenId: 160,
    collection: 'Kurio Sound',
    creator: 'Mina Vale',
    category: 'Music',
    description:
      'Uma transmissão em dourado de Mina Vale, finalizada à mão e verificada na Solana. Um retrato de música e movimento em alta resolução.',
    price: '0.39',
    network: 'solana',
    imageUrl: ARTWORK_10,
    attributes: ['Dourado', 'Transmissão', 'Música'],
    editions: openEdition('signal-standard', 'Standard', 12, 4, 60, 1),
  }),
  seedNft({
    id: 'nft-sage-nomad-2',
    name: 'Sage Nomad #010',
    tokenId: 10,
    collection: 'Kurio Genesis',
    creator: 'Nori Shin',
    category: 'Collectibles',
    description:
      'Um segundo retrato nômade de Nori Shin, finalizado à mão em violeta e verificado na Polygon. A peça completa a série de caminhantes.',
    price: '1.49',
    network: 'polygon',
    imageUrl: ARTWORK_07,
    attributes: ['Violeta', 'Nômade', 'Colecionável'],
    editions: openEdition('sage-2-standard', 'Standard', 5, 2, 50, 1),
  }),
  seedNft({
    id: 'nft-neon-vessel-2',
    name: 'Neon Vessel #553',
    tokenId: 553,
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: '3D Art',
    description:
      'Uma segunda peça de néon de Mina Vale, finalizada à mão e verificada na Ethereum. Um recipiente de luz em tiragem limitada.',
    price: '1.89',
    network: 'ethereum',
    imageUrl: ARTWORK_08,
    attributes: ['Neon', 'Recipiente', 'Estúdio'],
    editions: openEdition('neon-2-standard', 'Standard', 4, 2, 30, 1),
  }),
  seedNft({
    id: 'nft-ivory-baron-2',
    name: 'Ivory Baron #089',
    tokenId: 89,
    collection: 'Kurio Editions',
    creator: 'Mina Vale',
    category: 'Generative',
    description:
      'Um segundo retrato baronial de Mina Vale, finalizado à mão e verificado na Polygon. A peça é de tiragem limitada e procura constante.',
    price: '1.59',
    network: 'polygon',
    imageUrl: ARTWORK_08,
    attributes: ['Marfim', 'Barão', 'Nobre'],
    editions: openEdition('ivory-2-standard', 'Standard', 3, 1, 25, 1),
  }),
  seedNft({
    id: 'nft-golden-beat-2',
    name: 'Golden Beat #008',
    tokenId: 8,
    collection: 'Kurio Sound',
    creator: 'Mina Vale',
    category: 'Games',
    description:
      'Uma segunda sessão de escuta em dourado de Mina Vale, verificada na Ethereum. A obra desbloqueia conteúdo exclusivo para colecionadores.',
    price: '0.89',
    network: 'ethereum',
    imageUrl: ARTWORK_10,
    attributes: ['Dourado', 'Sessão', 'Música'],
    editions: openEdition('beat-2-standard', 'Standard', 9, 3, 40, 1),
  }),
  seedNft({
    id: 'nft-cosmic-blooms-2',
    name: 'Cosmic Blooms #119',
    tokenId: 119,
    collection: 'Kurio Editions',
    creator: 'Nori Shin',
    category: 'Utility',
    description:
      'Um segundo jardim cósmico de Nori Shin, finalizado à mão e verificado na Solana. Uma flor de luz para colecionar.',
    price: '1.19',
    network: 'solana',
    imageUrl: ARTWORK_07,
    attributes: ['Botânica', 'Cósmico', 'Flor'],
    editions: openEdition('cosmic-2-standard', 'Standard', 7, 3, 40, 1),
  }),
  seedNft({
    id: 'nft-kurio-pass',
    name: 'Kurio Pass #001',
    tokenId: 1,
    collection: 'Kurio Access',
    creator: 'Nori Shin',
    category: 'Subscriptions',
    description:
      'Um passe de acesso da coleção Kurio Access, de Nori Shin, verificado na Polygon. Garante prioridade em lançamentos e conteúdos exclusivos.',
    price: '0.49',
    network: 'polygon',
    imageUrl: ARTWORK_07,
    attributes: ['Acesso', 'Assinatura', 'Utilidade'],
    editions: openEdition('pass-standard', 'Standard', 10, 2, 100, 1),
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