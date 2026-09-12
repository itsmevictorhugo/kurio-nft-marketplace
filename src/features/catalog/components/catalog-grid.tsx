import { cn } from '@/lib/utils';
import { NftCardSkeleton } from '@/features/catalog/components/nft-card-skeleton';
import { NftCard } from '@/features/catalog/components/nft-card';
import type { Nft } from '@/types/domain';

interface CatalogGridProps {
  items: Nft[];
  isLoading: boolean;
  isUpdating?: boolean;
  skeletonCount?: number;
  className?: string;
}

export function CatalogGrid({ items, isLoading, isUpdating, skeletonCount = 6, className }: CatalogGridProps) {
  return (
    <ul
      aria-label="Resultados do catálogo"
      aria-busy={isLoading || isUpdating}
      className={cn('grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 md:gap-x-10 md:gap-y-10', isUpdating && 'opacity-70 transition-opacity', className)}
    >
      {isLoading
        ? Array.from({ length: skeletonCount }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))
        : items.map((nft, index) => (
            <li key={nft.id}>
              <NftCard nft={nft} priority={index < 3} />
            </li>
          ))}
    </ul>
  );
}
