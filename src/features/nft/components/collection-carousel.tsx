import { useQuery } from '@tanstack/react-query';
import { nftApi } from '@/lib/api/resources';
import { NftCard } from '@/features/catalog/components/nft-card';
import { NftCardSkeleton } from '@/features/catalog/components/nft-card-skeleton';

interface CollectionCarouselProps {
  collection: string;
  excludeId: string;
}

export function CollectionCarousel({ collection, excludeId }: CollectionCarouselProps) {
  const collectionQuery = useQuery({
    queryKey: ['nfts', 'collection', collection] as const,
    queryFn: () => nftApi.list({ search: collection, pageSize: 12 }),
  });

  const related = (collectionQuery.data?.items ?? [])
    .filter((nft) => nft.id !== excludeId)
    .slice(0, 5);

  if (!collectionQuery.isPending && related.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="collection-heading" className="mt-16" aria-busy={collectionQuery.isPending}>
      <h2 id="collection-heading" className="font-display text-xl font-bold text-kurio-cream">
        Mais desta coleção
      </h2>
      {collectionQuery.isPending ? (
        <ul className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <ul className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {related.map((nft) => (
              <li key={nft.id}>
                <NftCard nft={nft} />
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-kurio-flame" />
            <span className="h-2 w-2 rounded-full bg-kurio-flame/50" />
            <span className="h-2 w-2 rounded-full bg-kurio-flame/50" />
          </div>
        </>
      )}
    </section>
  );
}
