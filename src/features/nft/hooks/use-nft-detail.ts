import { useQuery } from '@tanstack/react-query';
import { nftApi } from '@/lib/api/resources';

export function useNftDetail(nftId: string) {
  return useQuery({
    queryKey: ['nfts', 'detail', nftId] as const,
    queryFn: () => nftApi.get(nftId),
    retry: false,
  });
}
