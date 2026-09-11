import { describe, expect, it } from 'vitest';
import {
  authApi,
  cartApi,
  favoritesApi,
  nftApi,
  ordersApi,
  profileApi,
  quoteApi,
  walletsApi,
} from '@/lib/api/resources';
import { selectMockScenario } from '@/mocks/scenarios';
import { getMockDatabase } from '@/mocks/database/mock-database';

async function loginAda() {
  return authApi.login({ email: 'ada@kurio.test', password: 'kurio-ada-2026' });
}

async function loginLin() {
  return authApi.login({ email: 'lin@kurio.test', password: 'kurio-lin-2026' });
}

describe('mock REST domain', () => {
  it('restores sessions and keeps favorites private to their authenticated user', async () => {
    const ada = await loginAda();
    const lin = await loginLin();

    await expect(authApi.session(ada.session.token)).resolves.toMatchObject({
      session: { user: { id: 'user-ada' } },
    });
    await favoritesApi.add(lin.session.token, 'nft-tide');

    await expect(favoritesApi.list(ada.session.token)).resolves.toEqual({
      items: [{ nftId: 'nft-aurora', createdAt: '2026-01-15T00:00:00.000Z' }],
    });
    await expect(favoritesApi.list(lin.session.token)).resolves.toMatchObject({
      items: [{ nftId: 'nft-tide' }],
    });
  });

  it('filters, sorts, paginates, and reports missing NFT detail through REST', async () => {
    await expect(nftApi.list({ category: 'Digital Art', sort: 'price-desc', page: 1, pageSize: 1 })).resolves.toMatchObject({
      total: 5,
      items: [{ id: 'nft-orbit' }],
    });
    await expect(nftApi.get('unknown')).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('enforces cart availability for a guest-owned cart', async () => {
    const identity = { guestId: 'domain-test' };
    const added = await cartApi.add(identity, {
      nftId: 'nft-aurora',
      editionId: 'aurora-standard',
      quantity: 2,
    });

    await expect(cartApi.update(identity, added.item.id, { quantity: 4 })).rejects.toMatchObject({
      response: { status: 409 },
    });
    await expect(cartApi.get(identity)).resolves.toMatchObject({
      cart: { items: [{ quantity: 2 }] },
    });
  });

  it('creates API-authoritative ETH quotes and rejects invalid coupons', async () => {
    const ada = await loginAda();
    await expect(quoteApi.create({ token: ada.session.token }, { couponCode: 'KURIO10' })).resolves.toMatchObject({
      quote: {
        subtotal: '2.125',
        discount: '0.2125',
        networkFee: '0.003',
        total: '1.9155',
      },
    });

    selectMockScenario('coupon-rejected');
    await expect(quoteApi.create({ token: ada.session.token }, { couponCode: 'KURIO10' })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it('recovers the same order for an idempotent retry and removes only confirmed quantities', async () => {
    const ada = await loginAda();
    const quote = await quoteApi.create({ token: ada.session.token });
    const first = await ordersApi.create(ada.session.token, { quoteId: quote.quote.id }, 'order-key-1');
    const retry = await ordersApi.create(ada.session.token, { quoteId: quote.quote.id }, 'order-key-1');

    expect(first.order).toMatchObject({ status: 'pending' });
    expect(retry.order.id).toBe(first.order.id);

    selectMockScenario('payment-confirmed');
    await expect(ordersApi.get(ada.session.token, first.order.id)).resolves.toMatchObject({
      order: { status: 'confirmed' },
    });
    await expect(cartApi.get({ token: ada.session.token })).resolves.toMatchObject({
      cart: { items: [] },
    });
  });

  it('returns the recovered order after a timeout and supports profile and wallet updates', async () => {
    const ada = await loginAda();
    const quote = await quoteApi.create({ token: ada.session.token });
    selectMockScenario('order-timeout');
    await expect(ordersApi.create(ada.session.token, { quoteId: quote.quote.id }, 'timeout-key')).rejects.toMatchObject({
      response: { status: 504 },
    });
    await expect(ordersApi.create(ada.session.token, { quoteId: quote.quote.id }, 'timeout-key')).resolves.toMatchObject({
      order: { status: 'pending' },
    });

    await expect(profileApi.update(ada.session.token, { displayName: 'Ada Updated' })).resolves.toMatchObject({
      profile: { displayName: 'Ada Updated' },
    });
    await expect(
      walletsApi.create(ada.session.token, {
        label: 'New primary',
        address: '0x4444444444444444444444444444444444444444',
        network: 'ethereum',
        isPrimary: true,
      }),
    ).resolves.toMatchObject({ wallet: { isPrimary: true } });
    await expect(walletsApi.list(ada.session.token)).resolves.toMatchObject({
      items: [{ isPrimary: false }, { isPrimary: false }, { label: 'New primary', isPrimary: true }],
    });
  });

  it('scopes idempotency keys to the authenticated user', async () => {
    const ada = await loginAda();
    const lin = await loginLin();
    await cartApi.add({ token: lin.session.token }, { nftId: 'nft-tide', editionId: 'tide-open', quantity: 1 });
    const adaQuote = await quoteApi.create({ token: ada.session.token });
    const linQuote = await quoteApi.create({ token: lin.session.token });
    const adaSecondQuote = await quoteApi.create({ token: ada.session.token });

    const adaOrder = await ordersApi.create(ada.session.token, { quoteId: adaQuote.quote.id }, 'shared-key');
    const linOrder = await ordersApi.create(lin.session.token, { quoteId: linQuote.quote.id }, 'shared-key');

    expect(linOrder.order.id).not.toBe(adaOrder.order.id);
    await expect(ordersApi.get(lin.session.token, adaOrder.order.id)).rejects.toMatchObject({
      response: { status: 403 },
    });
    await expect(
      ordersApi.create(ada.session.token, { quoteId: adaSecondQuote.quote.id }, 'shared-key'),
    ).rejects.toMatchObject({ response: { status: 409 } });
  });

  it('rejects an order whose quote coupon has expired since the quote was created', async () => {
    const ada = await loginAda();
    const quote = await quoteApi.create({ token: ada.session.token }, { couponCode: 'KURIO10' });
    getMockDatabase().coupons.find((coupon) => coupon.code === 'KURIO10')!.expiresAt = '2020-01-01T00:00:00.000Z';

    await expect(ordersApi.create(ada.session.token, { quoteId: quote.quote.id }, 'coupon-key')).rejects.toMatchObject({
      response: { data: { error: { code: 'coupon_expired' } } },
    });
  });

  it('merges guest cart items into the user cart without exceeding edition limits', async () => {
    await cartApi.add({ guestId: 'merge-test' }, { nftId: 'nft-aurora', editionId: 'aurora-standard', quantity: 3 });
    const ada = await authApi.login({ email: 'ada@kurio.test', password: 'kurio-ada-2026' }, 'merge-test');

    const { cart } = await cartApi.get({ token: ada.session.token });
    expect(cart.items).toHaveLength(2);
    expect(cart.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ nftId: 'nft-aurora', editionId: 'aurora-standard', quantity: 3 }),
        expect.objectContaining({ nftId: 'nft-tide', editionId: 'tide-open', quantity: 1 }),
      ]),
    );
  });

  it('adds guest quantities within availability limits when merging carts at login', async () => {
    await cartApi.add({ guestId: 'merge-within' }, { nftId: 'nft-tide', editionId: 'tide-open', quantity: 3 });
    const ada = await authApi.login({ email: 'ada@kurio.test', password: 'kurio-ada-2026' }, 'merge-within');

    const { cart } = await cartApi.get({ token: ada.session.token });
    expect(cart.items.find((item) => item.editionId === 'tide-open')?.quantity).toBe(4);
  });
});
