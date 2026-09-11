import { useQuery } from '@tanstack/react-query';
import { nftApi } from '@/lib/api/resources';
import type { Nft } from '@/types/domain';

export interface CatalogFacetCounts {
  categories: Array<{ value: string; count: number }>;
  creators: Array<{ value: string; count: number }>;
  networks: Array<{ value: string; count: number }>;
}

export interface CatalogOverview {
  featured: Nft | undefined;
  facets: CatalogFacetCounts;
  priceRange: { min: string; max: string } | undefined;
}

function countBy(nfts: Nft[], pick: (nft: Nft) => string) {
  const counts = new Map<string, number>();
  for (const nft of nfts) {
    const key = pick(nft);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => left.value.localeCompare(right.value));
}

export function useCatalogOverview() {
  return useQuery({
    queryKey: ['nfts', 'overview'] as const,
    queryFn: async (): Promise<CatalogOverview> => {
      const response = await nftApi.list({ pageSize: 50 });
      const prices = response.items.map((nft) => nft.price);
      return {
        featured: response.items[0],
        facets: {
          categories: countBy(response.items, (nft) => nft.category),
          creators: countBy(response.items, (nft) => nft.creator),
          networks: countBy(response.items, (nft) => nft.network),
        },
        priceRange:
          prices.length > 0
            ? {
                min: prices.reduce((min, price) => (price < min ? price : min)),
                max: prices.reduce((max, price) => (price > max ? price : max)),
              }
            : undefined,
      };
    },
    staleTime: 5 * 60_000,
  });
}
