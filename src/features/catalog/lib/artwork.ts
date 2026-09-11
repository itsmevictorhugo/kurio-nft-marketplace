/**
 * Static artwork assets for marketing sections of the Home (hero, banners,
 * editorial). NFT records carry their own `imageUrl` from the mock domain;
 * these constants only cover content that is not backed by an NFT record.
 * Mapping rationale is documented in docs/ARCHITECTURE.md (ADR-007).
 */
export const artwork = {
  hero: '/assets/nft/nft-artwork-03.png',
  heroOverlay: '/assets/nft/nft-artwork-07.png',
  bannerGenesis: '/assets/nft/nft-artwork-03.png',
  bannerDigital: '/assets/nft/nft-artwork-08.png',
  editorial: [
    '/assets/nft/nft-artwork-08.png',
    '/assets/nft/nft-artwork-03.png',
    '/assets/nft/nft-artwork-07.png',
    '/assets/nft/nft-artwork-10.png',
  ],
} as const;
