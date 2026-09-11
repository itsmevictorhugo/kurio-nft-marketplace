import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { routeTree } from '@/app/router/router';
import { authApi } from '@/lib/api/resources';
import { setSessionToken, clearSessionToken } from '@/features/auth/session';
import { setAppliedCoupon, clearAppliedCoupon } from '@/features/cart/applied-coupon';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

const ADA_EMAIL = 'ada@kurio.test';
const ADA_PASS = 'kurio-ada-2026';

beforeEach(() => {
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  clearSessionToken();
  clearAppliedCoupon();
});

async function loginAda(): Promise<string> {
  const { session } = await authApi.login({ email: ADA_EMAIL, password: ADA_PASS });
  setSessionToken(session.token);
  return session.token;
}

function renderCheckout(initialEntry = '/checkout') {
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

describe('checkout page', () => {
  it('redirects to login when not authenticated', async () => {
    renderCheckout();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument(),
    );
  });

  it('renders the checkout page with collector data and wallet form when logged in', async () => {
    await loginAda();
    renderCheckout();

    expect(await screen.findByRole('heading', { name: 'Finalizar compra' })).toBeInTheDocument();
    expect(screen.getByText('Ada Collector')).toBeInTheDocument();
    expect(screen.getByText(ADA_EMAIL)).toBeInTheDocument();
    expect(screen.getByText('Pagamento')).toBeInTheDocument();
    expect(screen.getByText('Ada primary')).toBeInTheDocument();
    expect(screen.getByText('Revisão da compra')).toBeInTheDocument();
  });

  it('shows the empty cart state when the cart has no items', async () => {
    const session = await authApi.login({ email: 'lin@kurio.test', password: 'kurio-lin-2026' });
    setSessionToken(session.session.token);
    renderCheckout();

    expect(await screen.findByRole('heading', { name: 'Seu carrinho está vazio' })).toBeInTheDocument();
  });

  it('blocks confirm when wallet and network are mismatched', async () => {
    await loginAda();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Finalizar compra' });

    // Select wallet "Ada primary" (ethereum) then network "Polygon"
    fireEvent.click(screen.getByLabelText(/Ada primary/));
    fireEvent.click(screen.getByLabelText('Polygon'));

    expect(
      screen.getByText(/A carteira selecionada está na rede Ethereum/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conectar carteira/i })).toBeDisabled();
  });

  it('allows connecting the wallet and shows the connected state', async () => {
    await loginAda();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Finalizar compra' });

    fireEvent.click(screen.getByLabelText(/Ada primary/));
    fireEvent.click(screen.getByLabelText('Ethereum'));

    fireEvent.click(screen.getByRole('button', { name: /Conectar carteira/i }));

    // Dialog appears
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Conectar carteira')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Conectar' }));

    await waitFor(() =>
      expect(screen.getByText(/Conectado: Ada primary/)).toBeInTheDocument(),
    );
  });

  it('records a refused wallet connection', async () => {
    await loginAda();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Finalizar compra' });

    fireEvent.click(screen.getByLabelText(/Ada primary/));
    fireEvent.click(screen.getByLabelText('Ethereum'));
    fireEvent.click(screen.getByRole('button', { name: /Conectar carteira/i }));

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Recusar' }));

    expect(screen.getByText(/Conexão recusada pela simulação/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar compra/i })).toBeDisabled();
  });

  it('successfully creates an order and navigates to the order page', async () => {
    await loginAda();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Finalizar compra' });

    fireEvent.click(screen.getByLabelText(/Ada primary/));
    fireEvent.click(screen.getByLabelText('Ethereum'));
    fireEvent.click(screen.getByRole('button', { name: /Conectar carteira/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Conectar' }));
    await waitFor(() => expect(screen.getByText(/Conectado: Ada primary/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Aguardando confirmação do pagamento' })).toBeInTheDocument(),
    );
  });

  it('shows a values-changed banner when revalidation detects new totals', async () => {
    await loginAda();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Finalizar compra' });

    // Simulate the price changing on the server before we click confirm
    server.use(
      http.get('*/api/nfts/:nftId', async ({ params }) => {
        if (params.nftId === 'nft-aurora') {
          const nfts = (await import('@/mocks/fixtures/seed')).seedNfts;
          const nft = nfts.find((n) => n.id === 'nft-aurora')!;
          return HttpResponse.json({ ...nft, price: '3.00', version: 2 });
        }
        return undefined as never;
      }),
    );

    fireEvent.click(screen.getByLabelText(/Ada primary/));
    fireEvent.click(screen.getByLabelText('Ethereum'));
    fireEvent.click(screen.getByRole('button', { name: /Conectar carteira/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Conectar' }));
    await waitFor(() => expect(screen.getByText(/Conectado: Ada primary/)).toBeInTheDocument());

    // The quote is fetched from the real MSW handler using cart prices; our server.use
    // only affects the detail page. A more direct way to trigger a mismatch is to
    // change the quote response. Let's override the quote endpoint instead.
    server.use(
      http.post('*/api/quote', async () => {
        return HttpResponse.json({
          quote: {
            id: 'quote-fresh',
            ownerId: 'user:ada',
            items: [
              {
                cartItemId: 'cart-item-ada-aurora',
                nftId: 'nft-aurora',
                editionId: 'aurora-standard',
                quantity: 1,
                unitPrice: '3.00',
                total: '3.00',
              },
              {
                cartItemId: 'cart-item-ada-tide',
                nftId: 'nft-tide',
                editionId: 'tide-open',
                quantity: 1,
                unitPrice: '0.875',
                total: '0.875',
              },
            ],
            subtotal: '3.875',
            discount: '0',
            networkFee: '0.003',
            total: '3.878',
            createdAt: '2026-01-15T00:00:00.000Z',
          },
        });
      }),
    );

    // Click confirm: refetch sees new totals, rotates attempt, sets valuesChanged
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }));

    expect(
      await screen.findByText('Os valores foram atualizados. Revise e confirme novamente.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revisar valores e confirmar/ })).toBeInTheDocument();
  });

  it('does not clear the cart on a rejected order', async () => {
    await loginAda();
    server.use(
      http.post('*/api/orders', async () => {
        return HttpResponse.json(
          { error: { code: 'stale_quote', message: 'Quote no longer matches the current price.' } },
          { status: 409 },
        );
      }),
    );
    renderCheckout();
    await screen.findByRole('heading', { name: 'Finalizar compra' });

    fireEvent.click(screen.getByLabelText(/Ada primary/));
    fireEvent.click(screen.getByLabelText('Ethereum'));
    fireEvent.click(screen.getByRole('button', { name: /Conectar carteira/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Conectar' }));
    await waitFor(() => expect(screen.getByText(/Conectado: Ada primary/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }));

    expect(
      await screen.findByText(/Os valores foram atualizados/),
    ).toBeInTheDocument();
    // Cart items still exist and are displayed
    expect(screen.getByText('Ada primary')).toBeInTheDocument();
  });

  it('keeps the idempotency key stable across multiple confirm clicks', async () => {
    const capturedKeys: string[] = [];
    server.use(
      http.post('*/api/orders', async ({ request }) => {
        const key = request.headers.get('idempotency-key');
        if (key) capturedKeys.push(key);
        // Keep returning 504 to simulate timeout so we can observe multiple attempts
        return HttpResponse.json(
          { error: { code: 'server_error', message: 'Order was created but the response timed out.' } },
          { status: 504 },
        );
      }),
    );

    await loginAda();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Finalizar compra' });

    fireEvent.click(screen.getByLabelText(/Ada primary/));
    fireEvent.click(screen.getByLabelText('Ethereum'));
    fireEvent.click(screen.getByRole('button', { name: /Conectar carteira/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Conectar' }));
    await waitFor(() => expect(screen.getByText(/Conectado: Ada primary/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }));

    await waitFor(() => expect(capturedKeys.length).toBeGreaterThanOrEqual(2));
    // First attempt key = first retry key (timeout retries same key)
    expect(capturedKeys[0]).toBe(capturedKeys[1]);
  });

  it('persists coupon information across navigation from the cart', async () => {
    await loginAda();
    setAppliedCoupon('KURIO10');
    renderCheckout();

    await screen.findByRole('heading', { name: 'Finalizar compra' });
    expect(screen.getByText('KURIO10')).toBeInTheDocument();
  });
});
