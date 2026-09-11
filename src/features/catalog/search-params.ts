import type { CatalogQuery } from '@/types/api';
import { isEthAmount } from '@/lib/money/eth';

export const catalogSorts = ['name-asc', 'price-asc', 'price-desc'] as const;

export type CatalogSort = (typeof catalogSorts)[number];

export const catalogNetworks = ['ethereum', 'polygon', 'solana'] as const;

export type CatalogNetwork = (typeof catalogNetworks)[number];

export interface CatalogSearch {
  search?: string;
  category?: string;
  creator?: string;
  sort?: CatalogSort;
  page?: number;
  minPrice?: string;
  maxPrice?: string;
  network?: CatalogNetwork;
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function validateCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const result: CatalogSearch = {};
  result.search = asOptionalString(search.search);
  result.category = asOptionalString(search.category);
  result.creator = asOptionalString(search.creator);
  const sort = asOptionalString(search.sort);
  if (sort && (catalogSorts as readonly string[]).includes(sort)) {
    result.sort = sort as CatalogSort;
  }
  const network = asOptionalString(search.network);
  if (network && (catalogNetworks as readonly string[]).includes(network)) {
    result.network = network as CatalogNetwork;
  }
  const minPrice = asOptionalString(search.minPrice);
  if (minPrice && isEthAmount(minPrice)) {
    result.minPrice = minPrice;
  }
  const maxPrice = asOptionalString(search.maxPrice);
  if (maxPrice && isEthAmount(maxPrice)) {
    result.maxPrice = maxPrice;
  }
  const page = typeof search.page === 'number' ? search.page : Number(search.page);
  if (Number.isInteger(page) && page > 1) {
    result.page = page;
  }
  return result;
}

export function toCatalogQuery(catalogSearch: CatalogSearch): CatalogQuery {
  return {
    search: catalogSearch.search,
    category: catalogSearch.category,
    creator: catalogSearch.creator,
    sort: catalogSearch.sort,
    page: catalogSearch.page ?? 1,
    minPrice: catalogSearch.minPrice,
    maxPrice: catalogSearch.maxPrice,
    network: catalogSearch.network,
  };
}
