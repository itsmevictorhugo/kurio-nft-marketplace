export function NftDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 md:px-6 md:pt-8" aria-hidden="true">
      <div className="shimmer h-3 w-40 rounded bg-kurio-raised" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
        <div className="flex gap-3">
          <div className="hidden shrink-0 flex-col gap-3 lg:flex">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="shimmer h-20 w-20 rounded-lg bg-kurio-raised" />
            ))}
          </div>
          <div className="min-w-0 flex-1 rounded-xl bg-kurio-surface p-4">
            <div className="shimmer aspect-square w-full rounded-lg bg-kurio-raised" />
          </div>
        </div>
        <div>
          <div className="shimmer h-8 w-3/4 rounded bg-kurio-raised" />
          <div className="shimmer mt-4 h-6 w-32 rounded bg-kurio-raised" />
          <div className="shimmer mt-6 h-4 w-full rounded bg-kurio-raised" />
          <div className="shimmer mt-2 h-4 w-5/6 rounded bg-kurio-raised" />
          <div className="mt-6 flex gap-2">
            <div className="shimmer h-8 w-24 rounded-full bg-kurio-raised" />
            <div className="shimmer h-8 w-24 rounded-full bg-kurio-raised" />
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="shimmer h-10 w-32 rounded-md bg-kurio-raised" />
            <div className="shimmer h-10 w-44 rounded-md bg-kurio-raised" />
          </div>
          <div className="mt-8 space-y-2 border-t border-kurio-line/60 pt-6">
            <div className="shimmer h-4 w-48 rounded bg-kurio-raised" />
            <div className="shimmer h-4 w-40 rounded bg-kurio-raised" />
          </div>
        </div>
      </div>
    </div>
  );
}
