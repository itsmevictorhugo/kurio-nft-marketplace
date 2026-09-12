import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { profileApi } from '@/lib/api/resources';
import { profileQueryKey } from '@/features/profile/hooks/use-profile';
import { useToast } from '@/lib/toast-context';
import { getSessionToken } from '@/features/auth/session';
import type { UpdateProfileInput, ChangePasswordInput, ProfileResponse } from '@/types/api';

function getProfileKey() {
  const token = getSessionToken();
  return token ? profileQueryKey(token) : ['profile', ''];
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.update(getSessionToken() as string, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: getProfileKey() });
      const previous = queryClient.getQueryData<ProfileResponse>(getProfileKey());
      queryClient.setQueryData<ProfileResponse>(getProfileKey(), (current) =>
        current
          ? {
              profile: {
                ...current.profile,
                ...input,
              },
            }
          : current,
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<ProfileResponse>(getProfileKey(), context.previous);
      }
      if (isAxiosError(error) && error.response?.status === 400) {
        const fields = error.response.data?.error?.fields;
        if (fields?.displayName) {
          showToast(fields.displayName, 'error');
        } else if (fields?.bio) {
          showToast(fields.bio, 'error');
        } else if (fields?.avatarUrl) {
          showToast(fields.avatarUrl, 'error');
        } else {
          showToast('Dados de perfil inválidos.', 'error');
        }
      } else {
        showToast('Não foi possível atualizar o perfil.', 'error');
      }
    },
    onSuccess: () => {
      showToast('Perfil atualizado com sucesso.', 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: getProfileKey() });
    },
  });
}

export function useChangePassword() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      profileApi.changePassword(getSessionToken() as string, input),
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 400) {
        const fields = error.response.data?.error?.fields;
        if (fields?.currentPassword) {
          showToast(fields.currentPassword, 'error');
        } else if (fields?.newPassword) {
          showToast(fields.newPassword, 'error');
        } else {
          showToast('Não foi possível alterar a senha.', 'error');
        }
      } else if (isAxiosError(error) && error.response?.status === 401) {
        showToast('Senha atual incorreta.', 'error');
      } else {
        showToast('Não foi possível alterar a senha.', 'error');
      }
    },
    onSuccess: () => {
      showToast('Senha alterada com sucesso.', 'success');
    },
  });
}