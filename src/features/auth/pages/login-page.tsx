import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/shared/icons';
import { authApi } from '@/lib/api/resources';
import { getGuestId } from '@/features/cart/guest-id';
import { setSessionToken } from '@/features/auth/session';
import type { LoginInput } from '@/types/api';

function loginErrorMessage(error: unknown) {
  if (isAxiosError(error) && error.response?.status === 401) {
    return 'Email ou senha inválidos.';
  }
  return 'Não foi possível entrar. Tente novamente.';
}

type LoginDestination = { kind: 'checkout' } | { kind: 'order'; orderId: string } | { kind: 'home' };

/**
 * Resolves the post-login destination from the `?redirect=` search value. Only
 * paths produced by the authentication guards are accepted; anything else
 * falls back to the catalog so an external URL can never be navigated to.
 */
function resolveLoginDestination(redirect: string | undefined): LoginDestination {
  const segments = redirect?.split('/').filter(Boolean) ?? [];
  if (segments[0] === 'checkout') {
    return { kind: 'checkout' };
  }
  if (segments[0] === 'order' && segments[1]) {
    return { kind: 'order', orderId: segments[1] };
  }
  return { kind: 'home' };
}

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input, getGuestId()),
    onSuccess: ({ session }) => {
      setSessionToken(session.token, session.user);
      const destination = resolveLoginDestination(search.redirect);
      if (destination.kind === 'checkout') {
        void navigate({ to: '/checkout' });
      } else if (destination.kind === 'order') {
        void navigate({ to: '/order/$orderId', params: { orderId: destination.orderId } });
      } else {
        void navigate({ to: '/' });
      }
    },
  });

  const canSubmit = Boolean(email.trim()) && Boolean(password) && !login.isPending;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    login.reset();
    login.mutate({ email: email.trim(), password });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 md:px-6 md:py-24">
      <h1 className="font-display text-2xl font-bold text-kurio-cream md:text-3xl">Entrar na sua conta</h1>
      <p className="mt-2 text-sm leading-relaxed text-kurio-tan">
        Entre para finalizar a compra. Suas obras favoritas e seu carrinho ficam vinculados à sua conta.
      </p>

      <form
        onSubmit={submit}
        noValidate
        className="mt-8 space-y-5 rounded-md border border-kurio-line/60 bg-kurio-surface p-5"
      >
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wide text-kurio-cream">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            className="h-10 w-full rounded-md border border-kurio-line bg-kurio-night px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wide text-kurio-cream">
            Senha
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            className="h-10 w-full rounded-md border border-kurio-line bg-kurio-night px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent"
          />
        </div>

        <p aria-live="polite" role="alert" className="min-h-5 text-sm font-bold text-kurio-accent">
          {login.isError ? loginErrorMessage(login.error) : null}
        </p>

        <Button type="submit" className="w-full" disabled={!canSubmit} onClick={() => login.reset()}>
          {login.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-kurio-tan">
        Ainda não tem uma conta?{' '}
        <Link
          to="/register"
          search={search.redirect ? { redirect: search.redirect } : undefined}
          className="font-display font-bold text-kurio-accent outline-none rounded-sm transition-colors hover:text-kurio-cream focus-visible:ring-2 focus-visible:ring-kurio-accent"
        >
          Cadastrar
          <ArrowRightIcon width={14} height={14} className="inline-block align-[-2px] ml-1" />
        </Link>
      </p>
    </div>
  );
}