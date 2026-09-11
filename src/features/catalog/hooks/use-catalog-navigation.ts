import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { CatalogSearch } from '@/features/catalog/search-params';

interface ApplyOptions {
  resetPage?: boolean;
  replace?: boolean;
}

export function useCatalogNavigation() {
  const navigate = useNavigate();

  const apply = useCallback(
    (update: Partial<CatalogSearch>, options?: ApplyOptions) => {
      const resetPage = options?.resetPage ?? true;
      void navigate({
        to: '/',
        replace: options?.replace,
        search: (previous) => ({
          ...previous,
          ...update,
          ...(resetPage ? { page: undefined } : {}),
        }),
      });
    },
    [navigate],
  );

  const clear = useCallback(() => {
    void navigate({ to: '/', search: {} });
  }, [navigate]);

  return { apply, clear };
}
