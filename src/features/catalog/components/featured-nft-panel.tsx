import { Link } from '@tanstack/react-router';
import type { Nft } from '@/types/domain';

interface FeaturedNftPanelProps {
  featured: Nft | undefined;
  isLoading: boolean;
}

export function FeaturedNftPanel({ featured, isLoading }: FeaturedNftPanelProps) {
  if (!featured) {
    if (!isLoading) {
      return null;
    }
    return (
      <section aria-label="NFT em destaque" className="rounded-xl bg-kurio-surface p-5">
        <div className="shimmer h-3 w-32 rounded bg-kurio-raised" />
        <div className="shimmer mt-2 h-3 w-24 rounded bg-kurio-raised" />
        <div className="shimmer mt-5 aspect-[4/5] w-full rounded-lg bg-kurio-raised" />
      </section>
    );
  }

  return (
    <section aria-label="NFT em destaque" className="rounded-xl bg-kurio-surface p-5">
      <p className="font-display text-sm font-bold uppercase tracking-[0.15em] text-kurio-accent">
        NFT em destaque
      </p>
      <p className="mt-1 font-display text-base font-bold text-kurio-cream">Oferta limitada</p>
      <Link
        to="/nft/$id"
        params={{ id: featured.id }}
        className="mt-5 block outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-kurio-surface"
      >
        <img
          src={featured.imageUrl}
          alt=""
          loading="lazy"
          className="aspect-[4/5] w-full rounded-lg object-cover"
        />
        <h3 className="mt-3 truncate text-base font-bold text-kurio-cream">{featured.name}</h3>
        <p className="mt-1.5 text-base font-bold text-kurio-accent">{featured.price} ETH</p>
      </Link>
    </section>
  );
}
