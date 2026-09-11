import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { RealtimeSync } from '@/features/realtime/hooks/use-realtime-sync';
import { queryClient } from '@/lib/query/query-client';
import { router } from '@/app/router/router';

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSync />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
