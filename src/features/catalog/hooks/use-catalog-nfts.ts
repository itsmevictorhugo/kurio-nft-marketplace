import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { nftApi } from '@/lib/api/resources';
import { toCatalogQuery, type CatalogSearch } from '@/features/catalog/search-params';

export function useCatalogNfts(catalogSearch: CatalogSearch) {
  return useQuery({
    queryKey: ['nfts', 'list', catalogSearch] as const,
    queryFn: () => nftApi.list(toCatalogQuery(catalogSearch)),
    placeholderData: keepPreviousData,
  });
}
