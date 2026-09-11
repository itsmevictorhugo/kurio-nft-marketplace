export function CheckoutSkeleton() {
  return (
    <div data-testid="checkout-skeleton" className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <div className="shimmer h-8 w-52 rounded-md" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
        <div className="space-y-6" aria-hidden="true">
          <div className="space-y-3 rounded-md border border-kurio-line/60 p-5">
            <div className="shimmer h-4 w-32 rounded-md" />
            <div className="shimmer h-4 w-48 rounded-md" />
            <div className="shimmer h-4 w-40 rounded-md" />
          </div>
          <div className="space-y-4 rounded-md border border-kurio-line/60 p-5">
            <div className="shimmer h-4 w-32 rounded-md" />
            <div className="shimmer h-10 w-full rounded-md" />
            <div className="shimmer h-14 w-full rounded-md" />
            <div className="shimmer h-14 w-full rounded-md" />
            <div className="shimmer h-10 w-full rounded-md" />
          </div>
        </div>
        <div className="space-y-3 rounded-md border border-kurio-line/60 p-5" aria-hidden="true">
          <div className="shimmer h-4 w-32 rounded-md" />
          <div className="shimmer h-4 w-full rounded-md" />
          <div className="shimmer h-4 w-full rounded-md" />
          <div className="shimmer h-4 w-3/4 rounded-md" />
          <div className="shimmer h-4 w-2/3 rounded-md" />
          <div className="shimmer h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}