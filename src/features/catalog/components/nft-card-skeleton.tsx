import { cn } from '@/lib/utils';

interface NftCardSkeletonProps {
  className?: string;
}

export function NftCardSkeleton({ className }: NftCardSkeletonProps) {
  return (
    <div className={cn('group', className)} aria-hidden="true">
      <div className="rounded-lg bg-kurio-surface p-2">
        <div className="shimmer aspect-square w-full rounded-md bg-kurio-raised" />
      </div>
      <div className="shimmer mt-3 h-5 w-3/4 rounded bg-kurio-raised" />
      <div className="shimmer mt-2 h-5 w-1/3 rounded bg-kurio-raised" />
    </div>
  );
}
