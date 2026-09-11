import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CatalogFacetCounts } from '@/features/catalog/hooks/use-catalog-overview';
import type { CatalogNetwork } from '@/features/catalog/search-params';

const categoryLabels: Record<string, string> = {
  'Digital Art': 'Arte digital',
  Photography: 'Fotografia',
  Music: 'Música',
  '3D Art': 'Arte 3D',
  Collectibles: 'Colecionáveis',
  Generative: 'Generativa',
  Games: 'Jogos',
  Subscriptions: 'Assinaturas',
  Utility: 'Utilidade',
};

const networkLabels: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
};

function facetLabel(value: string) {
  return categoryLabels[value] ?? value;
}

function formatEthLabel(value: string) {
  return value.replace('.', ',');
}

interface CatalogFiltersProps {
  facets: CatalogFacetCounts;
  priceRange: { min: string; max: string } | undefined;
  activeCategory?: string;
  activeCreator?: string;
  activeNetwork?: CatalogNetwork;
  activeMinPrice?: string;
  activeMaxPrice?: string;
  onSelectCategory: (category: string | undefined) => void;
  onSelectCreator: (creator: string | undefined) => void;
  onSelectNetwork: (network: CatalogNetwork | undefined) => void;
  onApplyPriceRange: (price: { min?: string; max?: string }) => void;
  className?: string;
}

const facetItemClass =
  'flex w-full items-center justify-between gap-2 rounded-sm px-1 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-kurio-accent';

export function CatalogFilters({
  facets,
  priceRange,
  activeCategory,
  activeCreator,
  activeNetwork,
  activeMinPrice,
  activeMaxPrice,
  onSelectCategory,
  onSelectCreator,
  onSelectNetwork,
  onApplyPriceRange,
  className,
}: CatalogFiltersProps) {
  const bounds = {
    min: priceRange ? Math.floor(Number(priceRange.min) * 10) / 10 : 0,
    max: priceRange ? Math.ceil(Number(priceRange.max) * 10) / 10 : 3,
  };
  const [minVal, setMinVal] = useState(
    activeMinPrice ? Number(activeMinPrice) : bounds.min,
  );
  const [maxVal, setMaxVal] = useState(
    activeMaxPrice ? Number(activeMaxPrice) : bounds.max,
  );

  const minPct = ((minVal - bounds.min) / (bounds.max - bounds.min)) * 100;
  const maxPct = ((maxVal - bounds.min) / (bounds.max - bounds.min)) * 100;

  const rangeLabel = `Preço: ${formatEthLabel(minVal.toFixed(2))} - ${formatEthLabel(maxVal.toFixed(2))} ETH`;

  const applyPriceRange = () => {
    onApplyPriceRange({
      min: minVal.toFixed(2),
      max: maxVal.toFixed(2),
    });
  };

  const rangeThumbClass =
    'pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent outline-none focus-visible:outline-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-kurio-night [&::-moz-range-thumb]:bg-kurio-flame [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-kurio-night [&::-webkit-slider-thumb]:bg-kurio-flame [&::-webkit-slider-thumb]:shadow [&:focus-visible::-webkit-slider-thumb]:ring-2 [&:focus-visible::-webkit-slider-thumb]:ring-kurio-cream [&:focus-visible::-moz-range-thumb]:ring-2 [&:focus-visible::-moz-range-thumb]:ring-kurio-cream';

  return (
    <aside
      aria-label="Filtros do catálogo"
      className={cn('rounded-xl bg-kurio-surface p-6', className)}
    >
      <section>
        <h3 className="font-display text-lg font-bold text-kurio-cream">
          Coleções
        </h3>
        <ul className="mt-3">
          {facets.categories.map((facet) => {
            const isActive = facet.value === activeCategory;
            return (
              <li key={facet.value}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onSelectCategory(isActive ? undefined : facet.value)
                  }
                  className={cn(
                    facetItemClass,
                    isActive
                      ? 'text-kurio-accent'
                      : 'text-kurio-tan hover:text-kurio-cream',
                  )}
                >
                  <span>{facetLabel(facet.value)}</span>
                  <span className="text-kurio-tan/70">({facet.count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Criadores" className="mt-8">
        <h3 className="font-display text-lg font-bold text-kurio-cream">
          Criadores
        </h3>
        <ul className="mt-3">
          {facets.creators.map((facet) => {
            const isActive = facet.value === activeCreator;
            return (
              <li key={facet.value}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onSelectCreator(isActive ? undefined : facet.value)
                  }
                  className={cn(
                    facetItemClass,
                    isActive
                      ? 'text-kurio-accent'
                      : 'text-kurio-tan hover:text-kurio-cream',
                  )}
                >
                  <span>{facet.value}</span>
                  <span className="text-kurio-tan/70">({facet.count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Faixa de preço" className="mt-8">
        <h3 className="font-display text-lg font-bold text-kurio-cream">
          Faixa de preço
        </h3>
        <div className="relative mt-4 h-5">
          <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-kurio-raised" />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-kurio-flame"
            style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
          />
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={0.1}
            value={minVal}
            aria-label="Preço mínimo em ETH"
            onChange={(event) =>
              setMinVal(Math.min(Number(event.target.value), maxVal))
            }
            style={{ zIndex: minPct > 50 ? 3 : 1 }}
            className={rangeThumbClass}
          />
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={0.1}
            value={maxVal}
            aria-label="Preço máximo em ETH"
            onChange={(event) =>
              setMaxVal(Math.max(Number(event.target.value), minVal))
            }
            className={rangeThumbClass}
          />
        </div>
        <p className="mt-3 text-sm text-kurio-cream">{rangeLabel}</p>
        <Button size="sm" className="mt-4" onClick={applyPriceRange}>
          Aplicar
        </Button>
      </section>

      <section className="mt-8">
        <h3 className="font-display text-lg font-bold text-kurio-cream">
          Rede
        </h3>
        <ul className="mt-3">
          {facets.networks.map((facet) => {
            const isActive = facet.value === activeNetwork;
            return (
              <li key={facet.value}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onSelectNetwork(
                      isActive ? undefined : (facet.value as CatalogNetwork),
                    )
                  }
                  className={cn(
                    facetItemClass,
                    isActive
                      ? 'text-kurio-accent'
                      : 'text-kurio-tan hover:text-kurio-cream',
                  )}
                >
                  <span>{networkLabels[facet.value] ?? facet.value}</span>
                  <span className="text-kurio-tan/70">({facet.count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
