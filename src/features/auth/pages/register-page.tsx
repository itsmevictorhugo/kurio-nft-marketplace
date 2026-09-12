import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/shared/icons';
import { authApi } from '@/lib/api/resources';
import { getGuestId } from '@/features/cart/guest-id';
import { setSessionToken } from '@/features/auth/session';
import type { RegisterInput } from '@/types/api';

function registerErrorMessage(error: unknown) {
  if (isAxiosError(error) && error.response?.status === 409) {
    return 'Já existe uma conta com este email.';
  }
  if (isAxiosError(error) && error.response?.status === 400) {
    const fields = error.response.data?.error?.fields;
    if (fields?.email) return 'Email inválido.';
    if (fields?.displayName) return 'Nome de exibição inválido.';
    if (fields?.password) return 'A senha deve ter pelo menos 8 caracteres.';
    return 'Dados de cadastro inválidos.';
  }
  return 'Não foi possível cadastrar. Tente novamente.';
}

type RegisterDestination = { kind: 'checkout' } | { kind: 'order'; orderId: string } | { kind: 'home' };

function resolveRegisterDestination(redirect: string | undefined): RegisterDestination {
  const segments = redirect?.split('/').filter(Boolean) ?? [];
  if (segments[0] === 'checkout') {
    return { kind: 'checkout' };
  }
  if (segments[0] === 'order' && segments[1]) {
    return { kind: 'order', orderId: segments[1] };
  }
  return { kind: 'home' };
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function RegisterPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/register' });
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const register = useMutation({
    mutationFn: async (input: RegisterInput) => {
      await authApi.register(input);
      const loginResult = await authApi.login({ email: input.email, password: input.password }, getGuestId());
      return loginResult;
    },
    onSuccess: ({ session }) => {
      setSessionToken(session.token, session.user);
      const destination = resolveRegisterDestination(search.redirect);
      if (destination.kind === 'checkout') {
        void navigate({ to: '/checkout' });
      } else if (destination.kind === 'order') {
        void navigate({ to: '/order/$orderId', params: { orderId: destination.orderId } });
      } else {
        void navigate({ to: '/' });
      }
    },
  });

  const validate = () => {
    let valid = true;
    if (!email.trim() || !validateEmail(email)) {
      setEmailError('Email inválido.');
      valid = false;
    } else {
      setEmailError('');
    }
    if (!displayName.trim() || displayName.trim().length < 2) {
      setDisplayNameError('Nome deve ter pelo menos 2 caracteres.');
      valid = false;
    } else {
      setDisplayNameError('');
    }
    if (!password || password.length < 8) {
      setPasswordError('A senha deve ter pelo menos 8 caracteres.');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    register.reset();
    register.mutate({
      email: email.trim(),
      displayName: displayName.trim(),
      password,
    });
  };

  const canSubmit = Boolean(email.trim() && displayName.trim() && password && !register.isPending);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 md:px-6 md:py-24">
      <h1 className="font-display text-2xl font-bold text-kurio-cream md:text-3xl">Criar sua conta</h1>
      <p className="mt-2 text-sm leading-relaxed text-kurio-tan">
        Cadastre-se para começar a colecionar. Suas obras favoritas e seu carrinho ficam vinculados à sua conta.
      </p>

      <form
        onSubmit={submit}
        noValidate
        className="mt-8 space-y-5 rounded-md border border-kurio-line/60 bg-kurio-surface p-5"
      >
        <div className="space-y-1.5">
          <label htmlFor="register-email" className="text-xs font-bold uppercase tracking-wide text-kurio-cream">
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError('');
            }}
            placeholder="voce@exemplo.com"
            className="h-10 w-full rounded-md border border-kurio-line bg-kurio-night px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'register-email-error' : undefined}
          />
          {emailError && (
            <p id="register-email-error" role="alert" className="text-sm text-kurio-accent">
              {emailError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-displayName" className="text-xs font-bold uppercase tracking-wide text-kurio-cream">
            Nome de exibição
          </label>
          <input
            id="register-displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              if (displayNameError) setDisplayNameError('');
            }}
            placeholder="Seu nome"
            className="h-10 w-full rounded-md border border-kurio-line bg-kurio-night px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent"
            aria-invalid={Boolean(displayNameError)}
            aria-describedby={displayNameError ? 'register-displayName-error' : undefined}
          />
          {displayNameError && (
            <p id="register-displayName-error" role="alert" className="text-sm text-kurio-accent">
              {displayNameError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-password" className="text-xs font-bold uppercase tracking-wide text-kurio-cream">
            Senha
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (passwordError) setPasswordError('');
            }}
            placeholder="Sua senha (mín. 8 caracteres)"
            className="h-10 w-full rounded-md border border-kurio-line bg-kurio-night px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent"
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? 'register-password-error' : undefined}
          />
          {passwordError && (
            <p id="register-password-error" role="alert" className="text-sm text-kurio-accent">
              {passwordError}
            </p>
          )}
        </div>

        <p aria-live="polite" role="alert" className="min-h-5 text-sm font-bold text-kurio-accent">
          {register.isError ? registerErrorMessage(register.error) : null}
        </p>

        <Button type="submit" className="w-full" disabled={!canSubmit} onClick={() => register.reset()}>
          {register.isPending ? 'Cadastrando...' : 'Cadastrar'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-kurio-tan">
        Já tem uma conta?{' '}
        <Link
          to="/login"
          search={search.redirect ? { redirect: search.redirect } : undefined}
          className="font-display font-bold text-kurio-accent outline-none rounded-sm transition-colors hover:text-kurio-cream focus-visible:ring-2 focus-visible:ring-kurio-accent"
        >
          Entrar
          <ArrowRightIcon width={14} height={14} className="inline-block align-[-2px] ml-1" />
        </Link>
      </p>
    </div>
  );
}