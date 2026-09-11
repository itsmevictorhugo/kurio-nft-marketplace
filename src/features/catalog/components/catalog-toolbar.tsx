import { cn } from '@/lib/utils';
import { SlidersIcon } from '@/components/shared/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CatalogSearch, CatalogSort } from '@/features/catalog/search-params';

const catalogTabs = [
  { label: 'Todos os NFTs', sort: undefined },
  { label: 'Novos lançamentos', sort: 'name-asc' },
  { label: 'Em alta', sort: 'price-desc' },
] as const satisfies ReadonlyArray<{ label: string; sort?: CatalogSort }>;

const sortOptions = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'name-asc', label: 'Nome (A - Z)' },
  { value: 'price-asc', label: 'Preço: menor para maior' },
  { value: 'price-desc', label: 'Preço: maior para menor' },
] as const;

const RECENT_SORT = 'recent';

interface CatalogToolbarProps {
  filters: CatalogSearch;
  onSortChange: (sort: CatalogSort | undefined) => void;
  onToggleFilters: () => void;
  filtersOpen: boolean;
}

export function CatalogToolbar({ filters, onSortChange, onToggleFilters, filtersOpen }: CatalogToolbarProps) {
  const activeTabSort = catalogTabs.find((tab) => tab.sort === filters.sort);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-kurio-line/60 pb-4">
      <button
        type="button"
        onClick={onToggleFilters}
        aria-expanded={filtersOpen}
        aria-controls="catalog-filters-panel"
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-kurio-surface text-kurio-cream outline-none transition-colors hover:bg-kurio-raised focus-visible:ring-2 focus-visible:ring-kurio-accent md:inline-flex lg:hidden"
      >
        <SlidersIcon />
        <span className="sr-only">{filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
      </button>

      <div className="flex flex-wrap items-center gap-5" role="group" aria-label="Coleções em destaque">
        {catalogTabs.map((tab) => {
          const isActive = tab.sort === activeTabSort?.sort;
          return (
            <button
              key={tab.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSortChange(tab.sort)}
              className={cn(
                'rounded-sm px-1 py-1 font-display text-xs font-bold tracking-wide outline-none transition-colors focus-visible:ring-2 focus-visible:ring-kurio-accent',
                isActive
                  ? 'text-kurio-accent underline decoration-2 underline-offset-8'
                  : 'text-kurio-cream hover:text-kurio-accent',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="whitespace-nowrap font-display text-sm text-kurio-cream" id="catalog-sort-label">
          Ordenar por:
        </span>
        <Select
          value={filters.sort ?? RECENT_SORT}
          onValueChange={(value) => onSortChange(value === RECENT_SORT ? undefined : (value as CatalogSort))}
        >
          <SelectTrigger
            aria-labelledby="catalog-sort-label"
            className="min-w-44 justify-between gap-2 rounded-md border border-kurio-line bg-kurio-surface px-3 py-2"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
