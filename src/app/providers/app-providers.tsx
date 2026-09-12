import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { RealtimeSync } from '@/features/realtime/hooks/use-realtime-sync';
import { ToastProvider } from '@/components/shared/toast';
import { queryClient } from '@/lib/query/query-client';
import { router } from '@/app/router/router';

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RealtimeSync />
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
