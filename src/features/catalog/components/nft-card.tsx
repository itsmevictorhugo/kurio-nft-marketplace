import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import type { Nft } from '@/types/domain';

interface NftCardProps {
  nft: Nft;
  className?: string;
}

export function NftCard({ nft, className }: NftCardProps) {
  return (
    <article className={cn('group', className)}>
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent"
      >
        <div className="rounded-lg bg-kurio-surface p-2 transition-colors group-hover:bg-kurio-raised">
          <img
            src={nft.imageUrl}
            alt=""
            loading="lazy"
            className="aspect-square w-full rounded-md object-cover"
          />
        </div>
        <h3 className="mt-3 truncate px-1 text-base font-bold text-kurio-cream">{nft.name}</h3>
        <p className="mt-1.5 px-1 pb-1 text-base font-bold text-kurio-accent">{nft.price} ETH</p>
      </Link>
    </article>
  );
}
