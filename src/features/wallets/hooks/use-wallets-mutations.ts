import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { walletsApi } from '@/lib/api/resources';
import { walletsQueryKey } from '@/features/wallets/hooks/use-wallets';
import { getRequestIdentity } from '@/features/cart/identity';
import { useToast } from '@/lib/toast-context';
import { getSessionToken } from '@/features/auth/session';
import type { CreateWalletInput, UpdateWalletInput, WalletsResponse } from '@/types/api';

function getWalletsKey() {
  const token = getSessionToken();
  const identity = getRequestIdentity();
  return token ? walletsQueryKey(identity) : ['wallets', ''];
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: CreateWalletInput) => walletsApi.create(getSessionToken() as string, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: getWalletsKey() });
      const previous = queryClient.getQueryData<WalletsResponse>(getWalletsKey());
      const optimisticWallet = {
        id: `wallet-optimistic-${Date.now()}`,
        label: input.label,
        address: input.address,
        network: input.network,
        isPrimary: input.isPrimary ?? false,
      };
      queryClient.setQueryData<WalletsResponse>(getWalletsKey(), (current) => {
        let items = current?.items ?? [];
        if (input.isPrimary) {
          items = items.map((w) => ({ ...w, isPrimary: false }));
        }
        return { items: [...items, optimisticWallet] };
      });
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<WalletsResponse>(getWalletsKey(), context.previous);
      }
      if (isAxiosError(error) && error.response?.status === 400) {
        const fields = error.response.data?.error?.fields;
        if (fields?.label) {
          showToast(fields.label, 'error');
        } else if (fields?.address) {
          showToast(fields.address, 'error');
        } else if (fields?.network) {
          showToast(fields.network, 'error');
        } else {
          showToast('Dados de carteira inválidos.', 'error');
        }
      } else if (isAxiosError(error) && error.response?.status === 409) {
        showToast('Esta carteira já está cadastrada.', 'error');
      } else {
        showToast('Não foi possível criar a carteira.', 'error');
      }
    },
    onSuccess: () => {
      showToast('Carteira adicionada com sucesso.', 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: getWalletsKey() });
    },
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ walletId, input }: { walletId: string; input: UpdateWalletInput }) =>
      walletsApi.update(getSessionToken() as string, walletId, input),
    onMutate: async ({ walletId, input }) => {
      await queryClient.cancelQueries({ queryKey: getWalletsKey() });
      const previous = queryClient.getQueryData<WalletsResponse>(getWalletsKey());
      queryClient.setQueryData<WalletsResponse>(getWalletsKey(), (current) => {
        if (!current) return current;
        let items = current.items.map((w) =>
          w.id === walletId ? { ...w, ...input } : w,
        );
        if (input.isPrimary) {
          items = items.map((w) => ({ ...w, isPrimary: w.id === walletId }));
        }
        return { items };
      });
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<WalletsResponse>(getWalletsKey(), context.previous);
      }
      if (isAxiosError(error) && error.response?.status === 400) {
        const fields = error.response.data?.error?.fields;
        if (fields?.label) {
          showToast(fields.label, 'error');
        } else if (fields?.address) {
          showToast(fields.address, 'error');
        } else if (fields?.network) {
          showToast(fields.network, 'error');
        } else {
          showToast('Dados de carteira inválidos.', 'error');
        }
      } else if (isAxiosError(error) && error.response?.status === 409) {
        showToast('Esta carteira já está cadastrada.', 'error');
      } else {
        showToast('Não foi possível atualizar a carteira.', 'error');
      }
    },
    onSuccess: () => {
      showToast('Carteira atualizada com sucesso.', 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: getWalletsKey() });
    },
  });
}