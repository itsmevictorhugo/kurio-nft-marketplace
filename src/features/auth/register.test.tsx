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

function renderRegister(initialEntry = '/register') {
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

describe('register page', () => {
  it('renders the heading and register form', async () => {
    renderRegister();
    expect(await screen.findByRole('heading', { name: 'Criar sua conta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome de exibição')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument();
  });

  it('does not submit when fields are empty', async () => {
    renderRegister();
    await screen.findByRole('heading', { name: 'Criar sua conta' });
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeDisabled();
  });

  it('displays validation errors for invalid email, short name, short password', async () => {
    renderRegister();
    await screen.findByRole('heading', { name: 'Criar sua conta' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText('Nome de exibição'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Email inválido.')).toBeInTheDocument();
    expect(await screen.findByText('Nome deve ter pelo menos 2 caracteres.')).toBeInTheDocument();
    expect(await screen.findByText('A senha deve ter pelo menos 8 caracteres.')).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it('displays an error for registration conflict (duplicate email)', async () => {
    renderRegister();
    await screen.findByRole('heading', { name: 'Criar sua conta' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@kurio.test' } });
    fireEvent.change(screen.getByLabelText('Nome de exibição'), { target: { value: 'Novo Usuario' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'nova-senha-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Já existe uma conta com este email.')).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it('registers successfully and redirects to home', async () => {
    renderRegister();
    await screen.findByRole('heading', { name: 'Criar sua conta' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'novo@usuario.test' } });
    fireEvent.change(screen.getByLabelText('Nome de exibição'), { target: { value: 'Novo Usuario' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'nova-senha-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(getSessionToken()).not.toBeNull());
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seja dono do futuro da arte digital' })).toBeInTheDocument());
  });

  it('redirects to checkout when redirect search param is present (new user has empty cart)', async () => {
    renderRegister('/register?redirect=/checkout');
    await screen.findByRole('heading', { name: 'Criar sua conta' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'novo2@usuario.test' } });
    fireEvent.change(screen.getByLabelText('Nome de exibição'), { target: { value: 'Novo Usuario' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'nova-senha-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(getSessionToken()).not.toBeNull());
    // New user has empty cart, so checkout shows empty cart state
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeInTheDocument());
  });
});