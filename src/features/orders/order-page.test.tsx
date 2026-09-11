import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { routeTree } from '@/app/router/router';
import { authApi, ordersApi, quoteApi } from '@/lib/api/resources';
import { setSessionToken, clearSessionToken } from '@/features/auth/session';

beforeAll(() => {
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  clearSessionToken();
});

function renderOrder(entry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [entry] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

async function loginAda(): Promise<string> {
  const { session } = await authApi.login({ email: 'ada@kurio.test', password: 'kurio-ada-2026' });
  setSessionToken(session.token);
  return session.token;
}

async function createPendingOrder(token: string): Promise<string> {
  const { quote } = await quoteApi.create({ token });
  const { order } = await ordersApi.create(token, { quoteId: quote.id }, `key-${Date.now()}`);
  return order.id;
}

describe('order detail page', () => {
  it('redirects to login when not authenticated', async () => {
    renderOrder('/order/nonexistent');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument(),
    );
  });

  it('shows not-found for an order belonging to another user', async () => {
    const adaToken = await loginAda();
    const orderId = await createPendingOrder(adaToken);

    // Log in as lin who cannot see ada's order
    clearSessionToken();
    const linSession = await authApi.login({ email: 'lin@kurio.test', password: 'kurio-lin-2026' });
    setSessionToken(linSession.session.token);

    renderOrder(`/order/${orderId}`);

    expect(
      await screen.findByRole('heading', { name: 'Pedido não encontrado' }),
    ).toBeInTheDocument();
  });

  it('shows pending status for a newly created order', async () => {
    const token = await loginAda();
    const orderId = await createPendingOrder(token);

    renderOrder(`/order/${orderId}`);

    expect(await screen.findByText('Pagamento pendente')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aguardando confirmação do pagamento' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atualizar status' })).toBeInTheDocument();
  });

  it('transitions to confirmed when the scenario changes', async () => {
    const token = await loginAda();
    const orderId = await createPendingOrder(token);

    renderOrder(`/order/${orderId}`);

    expect(await screen.findByText('Pagamento pendente')).toBeInTheDocument();

    // Set the scenario and click refresh
    await fetch('/api/__mock/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'payment-confirmed' }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar status' }));

    expect(await screen.findByText('Pagamento confirmado')).toBeInTheDocument();
    expect(
      screen.getByText(/Os NFTs foram adicionados à sua coleção/),
    ).toBeInTheDocument();
  });

  it('shows rejected status with a return to cart CTA', async () => {
    const token = await loginAda();
    const orderId = await createPendingOrder(token);

    await fetch('/api/__mock/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'payment-rejected' }),
    });

    renderOrder(`/order/${orderId}`);

    expect(await screen.findByText('Pagamento recusado')).toBeInTheDocument();
    expect(screen.getByText(/recusou o pagamento/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revisar carrinho/ })).toBeInTheDocument();
  });

  it('redirects from /order-confirmation to the home page', async () => {
    await loginAda();
    renderOrder('/order-confirmation');
    expect(await screen.findByRole('heading', { name: 'Seja dono do futuro da arte digital' })).toBeInTheDocument();
  });

  it('renders the receipt with order totals', async () => {
    const token = await loginAda();
    const orderId = await createPendingOrder(token);
    renderOrder(`/order/${orderId}`);

    await screen.findByText('Pagamento pendente');
    expect(screen.getByRole('region', { name: 'Comprovante do pedido' })).toBeInTheDocument();
    expect(screen.getByText(`#${orderId}`)).toBeInTheDocument();
  });
});
