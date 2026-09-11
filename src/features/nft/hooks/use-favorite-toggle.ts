import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSessionToken } from '@/features/auth/session';
import { favoritesApi } from '@/lib/api/resources';

export function useFavoriteToggle(nftId: string) {
  const queryClient = useQueryClient();
  const token = getSessionToken();

  const favoritesQuery = useQuery({
    queryKey: ['favorites'] as const,
    queryFn: () => favoritesApi.list(token as string),
    enabled: Boolean(token),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const isFavorite = favoritesQuery.data?.items.some((favorite) => favorite.nftId === nftId) ?? false;
      // Guests intentionally hit the real API: the 401 contract drives the
      // "sign in to favorite" feedback instead of local-only persistence.
      if (isFavorite) {
        await favoritesApi.remove(token ?? '', nftId);
      } else {
        await favoritesApi.add(token ?? '', nftId);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return {
    isAuthenticated: Boolean(token),
    isFavorite: favoritesQuery.data?.items.some((favorite) => favorite.nftId === nftId) ?? false,
    toggleFavorite: mutation.mutate,
    isToggling: mutation.isPending,
    error: mutation.error,
    resetError: mutation.reset,
  };
}
