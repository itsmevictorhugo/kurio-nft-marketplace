import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import { profileApi } from '@/lib/api/resources';
import { profileQueryKey } from '@/features/profile/hooks/use-profile';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { getSessionToken, clearSessionToken } from '@/features/auth/session';
import type { UpdateProfileInput, ChangePasswordInput, ProfileResponse } from '@/types/api';

function getProfileKey() {
  const token = getSessionToken();
  return token ? profileQueryKey(token) : ['profile', ''];
}

function validateDisplayName(name: string) {
  return name.trim().length >= 2;
}

function validateBio(bio: string) {
  return bio.length <= 500;
}

function validateAvatarUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validatePassword(password: string) {
  return password.length >= 8;
}

const inputClass =
  'h-10 w-full rounded-md border border-kurio-line bg-kurio-night px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent disabled:opacity-50 disabled:cursor-not-allowed';

const labelClass = 'text-xs font-bold uppercase tracking-wide text-kurio-cream';
const errorClass = 'text-sm text-kurio-accent';

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const profile = useProfile(getSessionToken());

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [bioError, setBioError] = useState('');
  const [avatarUrlError, setAvatarUrlError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const updateProfile = useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      profileApi.update(getSessionToken() as string, input),
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
          setDisplayNameError(fields.displayName);
        } else if (fields?.bio) {
          setBioError(fields.bio);
        } else if (fields?.avatarUrl) {
          setAvatarUrlError(fields.avatarUrl);
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

  const changePassword = useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      profileApi.changePassword(getSessionToken() as string, input),
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 400) {
        const fields = error.response.data?.error?.fields;
        if (fields?.currentPassword) {
          setCurrentPasswordError(fields.currentPassword);
        } else if (fields?.newPassword) {
          setNewPasswordError(fields.newPassword);
        } else {
          showToast('Não foi possível alterar a senha.', 'error');
        }
      } else if (isAxiosError(error) && error.response?.status === 401) {
        setCurrentPasswordError('Senha atual incorreta.');
      } else {
        showToast('Não foi possível alterar a senha.', 'error');
      }
    },
    onSuccess: () => {
      showToast('Senha alterada com sucesso.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
  });

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisplayNameError('');
    setBioError('');
    setAvatarUrlError('');

    let valid = true;
    if (!validateDisplayName(displayName)) {
      setDisplayNameError('Nome deve ter pelo menos 2 caracteres.');
      valid = false;
    } else {
      setDisplayNameError('');
    }
    if (!validateBio(bio)) {
      setBioError('Bio deve ter no máximo 500 caracteres.');
      valid = false;
    } else {
      setBioError('');
    }
    if (avatarUrl && !validateAvatarUrl(avatarUrl)) {
      setAvatarUrlError('URL do avatar inválida.');
      valid = false;
    } else {
      setAvatarUrlError('');
    }
    if (!valid) return;

    updateProfile.mutate({ displayName: displayName.trim(), bio: bio.trim(), avatarUrl: avatarUrl.trim() });
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    let valid = true;
    if (!currentPassword) {
      setCurrentPasswordError('Senha atual é obrigatória.');
      valid = false;
    }
    if (!validatePassword(newPassword)) {
      setNewPasswordError('A nova senha deve ter pelo menos 8 caracteres.');
      valid = false;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('As senhas não conferem.');
      valid = false;
    }
    if (!valid) return;

    changePassword.mutate({ currentPassword, newPassword });
  };

  if (profile.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-kurio-flame border-t-transparent" />
        <p className="text-sm text-kurio-tan">Carregando perfil...</p>
      </div>
    );
  }

  if (profile.isError) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-2xl font-bold text-kurio-cream">Não foi possível carregar o perfil.</h1>
        <p className="max-w-md text-sm leading-relaxed text-kurio-tan">
          Ocorreu uma falha inesperada ao acessar seu perfil. Tente novamente em instantes.
        </p>
        <Button onClick={() => void profile.refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const data = profile.data;

  if (displayName === '' && data) {
    setDisplayName(data.displayName);
    setBio(data.bio);
    setAvatarUrl(data.avatarUrl);
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <h1 className="font-display text-2xl font-bold text-kurio-cream md:text-3xl">Perfil do Colecionador</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section aria-labelledby="profile-heading" className="space-y-6">
          <div className="rounded-md border border-kurio-line/60 bg-kurio-surface p-5">
            <h2 id="profile-heading" className="font-display text-xl text-kurio-cream mb-4">
              Informações do Perfil
            </h2>
            <form onSubmit={handleProfileSubmit} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="profile-displayName" className={labelClass}>
                  Nome de exibição
                </label>
                <input
                  id="profile-displayName"
                  type="text"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value);
                    if (displayNameError) setDisplayNameError('');
                  }}
                  placeholder="Seu nome"
                  className={inputClass}
                  aria-invalid={Boolean(displayNameError)}
                  aria-describedby={displayNameError ? 'profile-displayName-error' : undefined}
                  disabled={updateProfile.isPending}
                />
                {displayNameError && (
                  <p id="profile-displayName-error" role="alert" className={errorClass}>
                    {displayNameError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-bio" className={labelClass}>
                  Bio
                </label>
                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(event) => {
                    setBio(event.target.value);
                    if (bioError) setBioError('');
                  }}
                  placeholder="Conte algo sobre você..."
                  rows={4}
                  className={`w-full rounded-md border border-kurio-line bg-kurio-night px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent resize-none ${updateProfile.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-invalid={Boolean(bioError)}
                  aria-describedby={bioError ? 'profile-bio-error' : undefined}
                  disabled={updateProfile.isPending}
                  maxLength={500}
                />
                {bioError && (
                  <p id="profile-bio-error" role="alert" className={errorClass}>
                    {bioError}
                  </p>
                )}
                <p className="text-xs text-kurio-tan/70 text-right">
                  {bio.length}/500
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-avatarUrl" className={labelClass}>
                  URL do Avatar
                </label>
                <input
                  id="profile-avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => {
                    setAvatarUrl(event.target.value);
                    if (avatarUrlError) setAvatarUrlError('');
                  }}
                  placeholder="https://exemplo.com/avatar.png"
                  className={inputClass}
                  aria-invalid={Boolean(avatarUrlError)}
                  aria-describedby={avatarUrlError ? 'profile-avatarUrl-error' : undefined}
                  disabled={updateProfile.isPending}
                />
                {avatarUrlError && (
                  <p id="profile-avatarUrl-error" role="alert" className={errorClass}>
                    {avatarUrlError}
                  </p>
                )}
              </div>

              <p aria-live="polite" role="alert" className="min-h-5 text-sm font-bold text-kurio-accent">
                {updateProfile.isError ? 'Não foi possível atualizar o perfil.' : null}
              </p>

              <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </form>
          </div>
        </section>

        <section aria-labelledby="avatar-preview-heading" className="space-y-6">
          <div className="rounded-md border border-kurio-line/60 bg-kurio-surface p-5 flex flex-col items-center gap-4">
            <h2 id="avatar-preview-heading" className="font-display text-xl text-kurio-cream">
              Pré-visualização do Avatar
            </h2>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Pré-visualização do avatar"
                className="h-32 w-32 rounded-full object-cover border border-kurio-line"
              />
            ) : (
              <div className="h-32 w-32 rounded-full border border-kurio-line/50 flex items-center justify-center bg-kurio-surface">
                <span className="text-kurio-tan text-4xl">?</span>
              </div>
            )}
            <p className="text-sm text-kurio-tan text-center">
              {avatarUrl ? 'Avatar será exibido assim no seu perfil.' : 'Adicione uma URL de avatar para ver a pré-visualização.'}
            </p>
          </div>
        </section>

        <section aria-labelledby="password-heading" className="space-y-6">
          <div className="rounded-md border border-kurio-line/60 bg-kurio-surface p-5">
            <h2 id="password-heading" className="font-display text-xl text-kurio-cream mb-4">
              Alterar Senha
            </h2>
            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="profile-currentPassword" className={labelClass}>
                  Senha atual
                </label>
                <input
                  id="profile-currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    if (currentPasswordError) setCurrentPasswordError('');
                  }}
                  placeholder="Sua senha atual"
                  className={inputClass}
                  aria-invalid={Boolean(currentPasswordError)}
                  aria-describedby={currentPasswordError ? 'profile-currentPassword-error' : undefined}
                  disabled={changePassword.isPending}
                />
                {currentPasswordError && (
                  <p id="profile-currentPassword-error" role="alert" className={errorClass}>
                    {currentPasswordError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-newPassword" className={labelClass}>
                  Nova senha
                </label>
                <input
                  id="profile-newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    if (newPasswordError) setNewPasswordError('');
                  }}
                  placeholder="Nova senha (mín. 8 caracteres)"
                  className={inputClass}
                  aria-invalid={Boolean(newPasswordError)}
                  aria-describedby={newPasswordError ? 'profile-newPassword-error' : undefined}
                  disabled={changePassword.isPending}
                />
                {newPasswordError && (
                  <p id="profile-newPassword-error" role="alert" className={errorClass}>
                    {newPasswordError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-confirmPassword" className={labelClass}>
                  Confirmar nova senha
                </label>
                <input
                  id="profile-confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  placeholder="Confirme a nova senha"
                  className={inputClass}
                  aria-invalid={Boolean(confirmPasswordError)}
                  aria-describedby={confirmPasswordError ? 'profile-confirmPassword-error' : undefined}
                  disabled={changePassword.isPending}
                />
                {confirmPasswordError && (
                  <p id="profile-confirmPassword-error" role="alert" className={errorClass}>
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              <p aria-live="polite" role="alert" className="min-h-5 text-sm font-bold text-kurio-accent">
                {changePassword.isError ? 'Não foi possível alterar a senha.' : null}
              </p>

              <Button type="submit" className="w-full" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Alterando...' : 'Alterar senha'}
              </Button>
            </form>
          </div>
        </section>

        <section aria-labelledby="danger-heading" className="space-y-6">
          <div className="rounded-md border border-kurio-accent/30 bg-kurio-surface p-5">
            <h2 id="danger-heading" className="font-display text-xl text-kurio-accent mb-2">
              Zona de Perigo
            </h2>
            <p className="text-sm text-kurio-tan mb-4">
              Estas ações são irreversíveis. Tenha certeza antes de prosseguir.
            </p>
            <Button
              variant="outline"
              className="w-full border-kurio-accent text-kurio-accent hover:bg-kurio-flame/10"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja sair? Isso encerrará sua sessão.')) {
                  clearSessionToken();
                  window.location.href = '/login';
                }
              }}
            >
              Sair da conta
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}