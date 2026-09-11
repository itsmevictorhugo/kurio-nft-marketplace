import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { CatalogToolbar } from '@/features/catalog/components/catalog-toolbar';
import { CatalogFilters } from '@/features/catalog/components/catalog-filters';
import { CatalogGrid } from '@/features/catalog/components/catalog-grid';
import { CatalogPagination } from '@/features/catalog/components/catalog-pagination';
import {
  CatalogEmpty,
  CatalogError,
} from '@/features/catalog/components/catalog-messages';
import { FeaturedNftPanel } from '@/features/catalog/components/featured-nft-panel';
import { HomeHero } from '@/features/catalog/components/home-hero';
import { HomeBanners } from '@/features/catalog/components/home-banners';
import { HomeEditorial } from '@/features/catalog/components/home-editorial';
import { useCatalogNfts } from '@/features/catalog/hooks/use-catalog-nfts';
import { useCatalogOverview } from '@/features/catalog/hooks/use-catalog-overview';
import { useCatalogNavigation } from '@/features/catalog/hooks/use-catalog-navigation';
import type {
  CatalogNetwork,
  CatalogSort,
} from '@/features/catalog/search-params';
import { cn } from '@/lib/utils';
import { SlidersIcon } from '@/components/shared/icons';

const emptyFacets = { categories: [], creators: [], networks: [] };

export function HomePage() {
  const filters = useSearch({ from: '/' });
  const catalogQuery = useCatalogNfts(filters);
  const overviewQuery = useCatalogOverview();
  const { apply, clear } = useCatalogNavigation();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const overview = overviewQuery.data;
  const items = catalogQuery.data?.items ?? [];
  const totalPages = catalogQuery.data?.totalPages ?? 1;
  const isLoading = catalogQuery.isPending;

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-4 pt-4 md:hidden">
        <div
          role="search"
          className="flex w-full items-center gap-2 rounded-md border border-kurio-line bg-kurio-surface px-3"
        >
          <label htmlFor="catalog-search-mobile" className="sr-only">
            Buscar NFTs por nome, coleção ou criador
          </label>
          <input
            id="catalog-search-mobile"
            name="search"
            type="search"
            value={filters.search ?? ''}
            placeholder="Explorar coleções"
            onChange={(event) =>
              apply(
                { search: event.target.value || undefined },
                { replace: true },
              )
            }
            className="h-11 w-full min-w-0 bg-transparent font-display text-sm text-kurio-cream placeholder:text-kurio-tan/70 focus-visible:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters-panel"
          className="inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-md bg-kurio-flame text-kurio-night outline-none transition-colors hover:bg-kurio-accent focus-visible:ring-2 focus-visible:ring-kurio-accent"
        >
          <SlidersIcon />
          <span className="sr-only">
            {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
          </span>
        </button>
      </div>

      <HomeHero />

      <section
        id="catalogo"
        aria-labelledby="catalog-heading"
        className="mx-auto w-full max-w-[1200px] scroll-mt-6 px-4 py-12 md:px-6 md:py-16"
      >
        <h2 id="catalog-heading" className="sr-only">
          Catálogo de NFTs
        </h2>

        <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-14">
          <div
            id="catalog-filters-panel"
            className={cn(
              'space-y-8',
              filtersOpen ? 'block' : 'hidden',
              'lg:block',
            )}
          >
            <CatalogFilters
              key={`${filters.minPrice ?? ''}-${filters.maxPrice ?? ''}-${overview?.priceRange?.min ?? ''}-${overview?.priceRange?.max ?? ''}`}
              facets={overview?.facets ?? emptyFacets}
              priceRange={overview?.priceRange}
              activeCategory={filters.category}
              activeCreator={filters.creator}
              activeNetwork={filters.network}
              activeMinPrice={filters.minPrice}
              activeMaxPrice={filters.maxPrice}
              onSelectCategory={(category) => apply({ category })}
              onSelectCreator={(creator) => apply({ creator })}
              onSelectNetwork={(network: CatalogNetwork | undefined) =>
                apply({ network })
              }
              onApplyPriceRange={(price) =>
                apply({ minPrice: price.min, maxPrice: price.max })
              }
            />
            <div className="hidden lg:block">
              <FeaturedNftPanel
                featured={overview?.featured}
                isLoading={overviewQuery.isPending}
              />
            </div>
          </div>

          <div>
            <CatalogToolbar
              filters={filters}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen((open) => !open)}
              onSortChange={(sort: CatalogSort | undefined) => apply({ sort })}
            />

            <div className="mt-8">
              {catalogQuery.isError ? (
                <CatalogError onRetry={() => void catalogQuery.refetch()} />
              ) : (
                <>
                  <CatalogGrid
                    items={items}
                    isLoading={isLoading}
                    isUpdating={
                      catalogQuery.isFetching && !catalogQuery.isPending
                    }
                  />
                  {!isLoading && items.length === 0 ? (
                    <div className="mt-4">
                      <CatalogEmpty onClearFilters={clear} />
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <CatalogPagination
              className="mt-10"
              page={filters.page ?? 1}
              totalPages={totalPages}
              onPageChange={(page) => apply({ page }, { resetPage: false })}
            />
          </div>
        </div>
      </section>

      <HomeBanners onExplore={(category) => apply({ category })} />
      <HomeEditorial />
    </>
  );
}
