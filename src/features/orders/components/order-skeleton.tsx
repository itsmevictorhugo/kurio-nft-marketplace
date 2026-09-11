export function OrderSkeleton() {
  return (
    <div data-testid="order-skeleton" className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-8 md:px-6 md:pt-10">
      <div className="shimmer h-6 w-44 rounded-md" />
      <div className="mt-3 shimmer h-4 w-72 rounded-md" />
      <div className="mt-8 space-y-4">
        <div className="shimmer h-8 w-56 rounded-md" />
        <div className="shimmer h-4 w-80 rounded-md" />
        <div className="shimmer h-24 w-full rounded-md" />
        <div className="shimmer h-24 w-full rounded-md" />
        <div className="shimmer h-10 w-48 rounded-md" />
      </div>
    </div>
  );
}