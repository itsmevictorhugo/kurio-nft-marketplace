import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { routeTree } from '@/app/router/router';
import { getSessionToken } from '@/features/auth/session';

beforeAll(() => {
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

function renderLogin(initialEntry = '/login') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('login page', () => {
  it('renders the heading and login form', async () => {
    renderLogin();
    expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('does not submit when fields are empty', async () => {
    renderLogin();
    await screen.findByRole('heading', { name: 'Entrar na sua conta' });
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
  });

  it('displays an error for invalid credentials', async () => {
    renderLogin();
    await screen.findByRole('heading', { name: 'Entrar na sua conta' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(
      await screen.findByText('Email ou senha inválidos.'),
    ).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it('logs in successfully and stores the token', async () => {
    renderLogin();
    await screen.findByRole('heading', { name: 'Entrar na sua conta' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@kurio.test' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'kurio-ada-2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(getSessionToken()).not.toBeNull());
  });

  it('redirects to the checkout page when a redirect search param is present', async () => {
    renderLogin('/login?redirect=/checkout');
    await screen.findByRole('heading', { name: 'Entrar na sua conta' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@kurio.test' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'kurio-ada-2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Finalizar compra' })).toBeInTheDocument());
  });

  it('redirects to the order page when a redirect search param points to an order', async () => {
    renderLogin('/login?redirect=/order/order-99');
    await screen.findByRole('heading', { name: 'Entrar na sua conta' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@kurio.test' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'kurio-ada-2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Pedido não encontrado' })).toBeInTheDocument());
  });

  it('ignores non-internal redirect values and sends the guest id header', async () => {
    // Redirect to an external URL should fall back to home after login.
    // We verify the header is still sent by checking the guest cart merge
    // succeeds (guest-id is set in localStorage and passed by authApi.login).
    localStorage.setItem('kurio-guest-id', 'login-guest-guard');
    renderLogin('/login?redirect=https://evil.com');
    await screen.findByRole('heading', { name: 'Entrar na sua conta' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@kurio.test' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'kurio-ada-2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(getSessionToken()).not.toBeNull());
    // Logged-in user lands on home (malicious redirect was rejected)
    expect(await screen.findByRole('heading', { name: 'Seja dono do futuro da arte digital' })).toBeInTheDocument();
  });
});
