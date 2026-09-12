import { http, HttpResponse, delay } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { routeTree } from '@/app/router/router';
import { authApi, cartApi } from '@/lib/api/resources';
import { clearSessionToken, getSessionToken, setSessionToken } from '@/features/auth/session';
import { cartQueryKey, getRequestIdentity } from '@/features/cart/identity';
import { server } from '@/mocks/server';

beforeAll(() => {
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  clearSessionToken();
});

function renderCart(initialEntry = '/cart') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
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

async function seedGuestCart(
  guestId: string,
  items: Array<{ nftId: string; editionId: string; quantity: number }>,
) {
  localStorage.setItem('kurio-guest-id', guestId);
  for (const item of items) {
    await cartApi.add({ guestId }, item);
  }
}

function getCartItems() {
  return within(screen.getByRole('list', { name: 'Itens do carrinho' }));
}

function getSummary() {
  return within(screen.getByRole('region', { name: 'Resumo da compra' }));
}

async function findAuroraRow() {
  return await screen.findByRole('heading', { name: 'Carrinho de NFTs' });
}

const aurora = { nftId: 'nft-aurora', editionId: 'aurora-standard', quantity: 1 };
const tide = { nftId: 'nft-tide', editionId: 'tide-open', quantity: 1 };

describe('cart page', () => {
  it('renders the loading skeleton and then the cart content', async () => {
    server.use(
      http.get('*/api/cart', async () => {
        await delay(120);
        return HttpResponse.json({
          cart: {
            id: 'cart-loading',
            ownerId: 'guest:loading',
            items: [{ id: 'cart-item-loading', nftId: 'nft-aurora', editionId: 'aurora-standard', quantity: 1 }],
          },
        });
      }),
    );

    renderCart();

    await screen.findByTestId('cart-skeleton');
    await findAuroraRow();
    expect(await screen.findByText('Aurora Signal')).toBeInTheDocument();
  });

  it('renders the empty state with a catalog CTA', async () => {
    renderCart();

    expect(await screen.findByRole('heading', { name: 'Seu carrinho está vazio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /explorar nfts/i })).toBeInTheDocument();
  });

  it('renders items with edition, price and quote values', async () => {
    await seedGuestCart('guest-values', [aurora]);
    renderCart();

    await findAuroraRow();
    const items = getCartItems();
    expect(await items.findByText('Aurora Signal')).toBeInTheDocument();
    expect(items.getByText('Edição Standard')).toBeInTheDocument();
    expect(items.getAllByText('1.25 ETH').length).toBeGreaterThan(0);

    const summary = getSummary();
    expect(await summary.findByText('1.25 ETH')).toBeInTheDocument();
    expect(summary.getByText('0 ETH')).toBeInTheDocument();
    expect(summary.getByText('0.003 ETH')).toBeInTheDocument();
    expect(summary.getByText('1.253 ETH')).toBeInTheDocument();
  });

  it('changes quantity optimistically and reconciles the quote', async () => {
    await seedGuestCart('guest-qty', [aurora]);
    renderCart();

    await findAuroraRow();
    const stepper = within(screen.getByRole('group', { name: 'Quantidade' }));
    fireEvent.click(stepper.getByRole('button', { name: /aumentar quantidade/i }));

    await waitFor(() => expect(stepper.getByText('2')).toBeInTheDocument());
    expect(await getCartItems().findByText('2.5 ETH')).toBeInTheDocument();

    await waitFor(async () => {
      const cart = await cartApi.get({ guestId: 'guest-qty' });
      expect(cart.cart.items.find((item) => item.id === cart.cart.items[0].id)?.quantity).toBe(2);
    });
  });

  it('rolls back a failed quantity update and reports it accessibly', async () => {
    server.use(
      http.patch('*/api/cart/items/:itemId', async () => {
        await delay(50);
        return HttpResponse.error();
      }),
    );
    await seedGuestCart('guest-rollback', [aurora]);
    renderCart();

    await findAuroraRow();
    const stepper = within(screen.getByRole('group', { name: 'Quantidade' }));
    fireEvent.click(stepper.getByRole('button', { name: /aumentar quantidade/i }));

    await waitFor(() => expect(stepper.getByText('2')).toBeInTheDocument());
    await waitFor(() => expect(stepper.getByText('1')).toBeInTheDocument());
    expect(
      await screen.findByText('Não foi possível atualizar o carrinho. Tente novamente.'),
    ).toBeInTheDocument();
  });

  it('surfaces an availability conflict and reconciles with the server', async () => {
    server.use(
      http.patch('*/api/cart/items/:itemId', async () => {
        await delay(50);
        return HttpResponse.json(
          { error: { code: 'availability_conflict', message: 'Requested quantity is unavailable.' } },
          { status: 409 },
        );
      }),
    );
    await seedGuestCart('guest-conflict', [aurora]);
    renderCart();

    await findAuroraRow();
    const stepper = within(screen.getByRole('group', { name: 'Quantidade' }));
    fireEvent.click(stepper.getByRole('button', { name: /aumentar quantidade/i }));

    expect(
      await screen.findByText('Estoque insuficiente: ajustamos os itens conforme a disponibilidade.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(stepper.getByText('1')).toBeInTheDocument());
  });

  it('removes an item from the cart', async () => {
    await seedGuestCart('guest-remove', [aurora, tide]);
    renderCart();

    await findAuroraRow();
    expect(getCartItems().getByText('Aurora Signal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remover Aurora Signal do carrinho' }));

    await waitFor(() => expect(getCartItems().queryByText('Aurora Signal')).not.toBeInTheDocument());
    expect(getCartItems().getByText('Tide Archive')).toBeInTheDocument();
  });

  it('clears the cart', async () => {
    await seedGuestCart('guest-clear', [aurora, tide]);
    renderCart();

    await findAuroraRow();
    fireEvent.click(screen.getByRole('button', { name: /limpar carrinho/i }));

    expect(await screen.findByRole('heading', { name: 'Seu carrinho está vazio' })).toBeInTheDocument();
  });

  it('applies a valid coupon and shows the discounted totals', async () => {
    await seedGuestCart('guest-coupon', [aurora]);
    renderCart();

    await findAuroraRow();
    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'kurio10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(await screen.findByText('Cupom KURIO10 aplicado.')).toBeInTheDocument();
    const summary = getSummary();
    expect(summary.getByText('-0.125 ETH')).toBeInTheDocument();
    expect(summary.getByText('1.128 ETH')).toBeInTheDocument();
  });

  it('reports an invalid coupon and restores the plain quote', async () => {
    await seedGuestCart('guest-bad-coupon', [aurora]);
    renderCart();

    await findAuroraRow();
    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'NADA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(await screen.findByText('Esse cupom não é válido.')).toBeInTheDocument();
    const summary = getSummary();
    await waitFor(() => expect(summary.getByText('0 ETH')).toBeInTheDocument());
    expect(summary.getByText('1.253 ETH')).toBeInTheDocument();
  });

  it('reports an expired coupon', async () => {
    await seedGuestCart('guest-expired-coupon', [aurora]);
    renderCart();

    await findAuroraRow();
    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'EXPIRED10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(await screen.findByText('Esse cupom expirou.')).toBeInTheDocument();
  });

  it('removes an applied coupon and restores the plain quote', async () => {
    await seedGuestCart('guest-remove-coupon', [aurora]);
    renderCart();

    await findAuroraRow();
    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'KURIO10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    await screen.findByText('Cupom KURIO10 aplicado.');

    fireEvent.click(screen.getByRole('button', { name: 'Remover cupom' }));

    const summary = getSummary();
    await waitFor(() => expect(summary.queryByText('-0.125 ETH')).not.toBeInTheDocument());
    expect(summary.getByText('0 ETH')).toBeInTheDocument();
  });
});

describe('cart identity', () => {
  it('sends the stable guest id header for visitors', async () => {
    let guestHeader: string | undefined;
    server.use(
      http.get('*/api/cart', ({ request }) => {
        guestHeader = request.headers.get('x-guest-id') ?? undefined;
        return HttpResponse.json({ cart: { id: 'cart-g', ownerId: 'guest:g', items: [] } });
      }),
    );
    localStorage.setItem('kurio-guest-id', 'identity-guest');

    renderCart();
    expect(await screen.findByRole('heading', { name: 'Seu carrinho está vazio' })).toBeInTheDocument();
    expect(guestHeader).toBe('identity-guest');
  });

  it('sends the authorization token for authenticated users', async () => {
    const session = await authApi.login({ email: 'ada@kurio.test', password: 'kurio-ada-2026' });
    setSessionToken(session.session.token);

    let authHeader: string | undefined;
    server.use(
      http.get('*/api/cart', ({ request }) => {
        authHeader = request.headers.get('authorization') ?? undefined;
        return HttpResponse.json({ cart: { id: 'cart-g', ownerId: 'user:ada', items: [] } });
      }),
    );

    renderCart();
    await screen.findByRole('heading', { name: 'Seu carrinho está vazio' });
    expect(authHeader).toBe(`Bearer ${session.session.token}`);
  });

  it('keeps guest and authenticated cart data in separate cache entries', async () => {
    await seedGuestCart('isol-guest', [aurora]);
    const guestKey = cartQueryKey({ guestId: 'isol-guest', sessionVersion: 0 });

    const session = await authApi.login({ email: 'ada@kurio.test', password: 'kurio-ada-2026' });
    setSessionToken(session.session.token);
    const authKey = cartQueryKey({ token: session.session.token, sessionVersion: 0 });

    expect(guestKey).not.toEqual(authKey);
    expect(getSessionToken()).toBe(session.session.token);
  });

  it('resolves identity as token when present and guest id otherwise', () => {
    const guest = getRequestIdentity();
    expect('guestId' in guest).toBe(true);

    const session = { token: 'session-test-token' };
    setSessionToken(session.token);
    expect(getRequestIdentity()).toEqual({ token: session.token, sessionVersion: 0 });

    clearSessionToken();
    expect('guestId' in getRequestIdentity()).toBe(true);
  });

  it('isolates an authenticated cart from a separate guest cart', async () => {
    await seedGuestCart('guest-own-cart', [tide]);

    const session = await authApi.login({ email: 'lin@kurio.test', password: 'kurio-lin-2026' });
    setSessionToken(session.session.token);

    renderCart();
    expect(await screen.findByRole('heading', { name: 'Seu carrinho está vazio' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Itens do carrinho' })).not.toBeInTheDocument();
  });
});

describe('guest to authenticated merge', () => {
  it('merges the guest cart into the user cart on login and clears the guest cart', async () => {
    localStorage.setItem('kurio-guest-id', 'merge-guest');
    await cartApi.add(
      { guestId: 'merge-guest' },
      { nftId: 'nft-orbit', editionId: 'orbit-collector', quantity: 1 },
    );

    const session = await authApi.login(
      { email: 'lin@kurio.test', password: 'kurio-lin-2026' },
      'merge-guest',
    );

    const userCart = await cartApi.get({ token: session.session.token });
    expect(userCart.cart.items.some((item) => item.nftId === 'nft-orbit')).toBe(true);

    const guestCart = await cartApi.get({ guestId: 'merge-guest' });
    expect(guestCart.cart.items).toHaveLength(0);
  });
});