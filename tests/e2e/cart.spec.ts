import { expect, test, type Page } from '@playwright/test';

/**
 * Cart E2E flows against the MSW-mocked API. Every scenario starts from an
 * isolated, deterministic state: localStorage is cleared so a brand new guest
 * identity (and therefore brand new guest cart) is created, and the mock
 * database is reset to its seed.
 */

async function resetMockState(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    // The mock control endpoints only exist after the MSW service worker is
    // active. Retry so a slow first worker activation never flakes the suite.
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const response = await fetch('/api/__mock/reset', { method: 'POST' });
        if (response.ok) {
          return;
        }
      } catch {
        // worker not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('Mock service worker never became ready.');
  });
}

async function setScenario(page: Page, scenario: string) {
  await page.evaluate(async (name) => {
    const response = await fetch('/api/__mock/scenario', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scenario: name }),
    });
    if (!response.ok) {
      throw new Error(`Unable to select scenario ${name}.`);
    }
  }, scenario);
}

function cartLink(page: Page) {
  return page.getByRole('link', { name: /Carrinho/ }).filter({ visible: true });
}

function addToCartButton(page: Page) {
  return page.getByRole('button', { name: /^Comprar/ }).filter({ visible: true });
}

function quantityStepper(page: Page, scope: Page | import('@playwright/test').Locator = page) {
  return scope.locator('[role="group"][aria-label="Quantidade"]').first();
}

function stepperButtons(page: Page, scope?: Page | import('@playwright/test').Locator) {
  return {
    increase: quantityStepper(page, scope).getByRole('button', { name: 'Aumentar quantidade' }),
    decrease: quantityStepper(page, scope).getByRole('button', { name: 'Diminuir quantidade' }),
    output: quantityStepper(page, scope).getByRole('status'),
  };
}

function cartItems(page: Page) {
  return page.getByRole('list', { name: 'Itens do carrinho' });
}

function summary(page: Page) {
  return page.getByRole('region', { name: 'Resumo da compra' });
}

async function addNftToCart(page: Page, nftPath: string) {
  await page.goto(nftPath);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await addToCartButton(page).click();
  await expect(page.getByText(/adicionado ao carrinho\./)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await resetMockState(page);
});

test('adds an NFT from the detail page and reflects it in the cart and badge', async ({ page }) => {
  await addNftToCart(page, '/nfts/nft-aurora');
  await expect(cartLink(page)).toHaveAccessibleName(/1 item/);

  await cartLink(page).click();

  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aurora Signal', exact: true })).toBeVisible();
  await expect(page.getByText('Edição Standard')).toBeVisible();
  await expect(page.getByText('Preço unitário: 1.25 ETH')).toBeVisible();

  const { increase } = stepperButtons(page);
  const { output } = stepperButtons(page);
  await expect(output).toHaveText('1');

  const resume = summary(page);
  await expect(resume.getByText('1.25 ETH').first()).toBeVisible();
  await expect(resume.getByText('0.003 ETH')).toBeVisible();
  await expect(resume.getByText('1.253 ETH')).toBeVisible();
  await expect(increase).toBeEnabled();
  await expect(page.evaluate(hasNoHorizontalOverflow)).resolves.toBe(true);
});

function hasNoHorizontalOverflow() {
  return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
}

test('edits item quantity, reconciles totals and persists after refresh', async ({ page }) => {
  await addNftToCart(page, '/nfts/nft-aurora');
  await cartLink(page).click();
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();

  const { increase, output } = stepperButtons(page);
  await increase.click();
  await expect(output).toHaveText('2');

  const resume = summary(page);
  await expect(resume.getByText('2.5 ETH').first()).toBeVisible();
  await expect(resume.getByText('2.503 ETH')).toBeVisible();
  await expect(cartLink(page)).toHaveAccessibleName(/2 itens/);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(stepperButtons(page).output).toHaveText('2');
  await expect(resume.getByText('2.503 ETH')).toBeVisible();
});

test('removes an item from the cart', async ({ page }) => {
  await addNftToCart(page, '/nfts/nft-aurora');
  await page.goto('/nfts/nft-tide');
  await addToCartButton(page).click();
  await expect(page.getByText(/adicionado ao carrinho\./)).toBeVisible();

  await cartLink(page).click();
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(cartItems(page).getByRole('link', { name: 'Aurora Signal', exact: true })).toBeVisible();
  await expect(cartItems(page).getByRole('link', { name: 'Tide Archive', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Remover Aurora Signal do carrinho' }).click();

  await expect(page.getByRole('link', { name: 'Aurora Signal', exact: true })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Tide Archive', exact: true })).toBeVisible();
  await expect(cartLink(page)).toHaveAccessibleName(/1 item/);
});

test('caps quantity at the per-order limit of the edition', async ({ page }) => {
  await addNftToCart(page, '/nfts/nft-aurora');
  await cartLink(page).click();
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();

  const { increase, output } = stepperButtons(page);
  await increase.click();
  await expect(output).toHaveText('2');
  await increase.click();
  await expect(output).toHaveText('3');
  await expect(increase).toBeDisabled();
  await expect(cartLink(page)).toHaveAccessibleName(/3 itens/);
});

test('shows the unavailable state when the edition sells out after being added', async ({ page }) => {
  await addNftToCart(page, '/nfts/nft-aurora');
  await expect(cartLink(page)).toHaveAccessibleName(/1 item/);

  await setScenario(page, 'sold-out');
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();

  await expect(page.getByText('Edição indisponível no momento.')).toBeVisible();
  await expect(stepperButtons(page).increase).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Finalizar compra' }),
  ).toBeDisabled();
});

test('applies, validates, rejects invalid and expired coupons, and removes a coupon', async ({ page }) => {
  await addNftToCart(page, '/nfts/nft-aurora');
  await cartLink(page).click();
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();

  const coupon = page.getByLabel('Cupom de desconto');
  const resume = summary(page);

  await coupon.fill('kurio10');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.getByText('Cupom KURIO10 aplicado.')).toBeVisible();
  await expect(resume.getByText('-0.125 ETH')).toBeVisible();
  await expect(resume.getByText('1.128 ETH')).toBeVisible();

  await page.getByRole('button', { name: 'Remover cupom' }).click();
  await expect(resume.getByText('1.253 ETH')).toBeVisible();
  await expect(page.getByText('Nenhum cupom aplicado.')).toBeVisible();

  await coupon.fill('NADA');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.getByText('Esse cupom não é válido.')).toBeVisible();
  await expect(resume.getByText('1.253 ETH')).toBeVisible();

  await coupon.fill('EXPIRED10');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.getByText('Esse cupom expirou.')).toBeVisible();
});

test('merges the guest cart into the user cart on login without leaking other carts', async ({ page }) => {
  await addNftToCart(page, '/nfts/nft-tide');

  const guestId = await page.evaluate(() => localStorage.getItem('kurio-guest-id'));
  expect(guestId).toBeTruthy();

  const token = await page.evaluate(async (guest) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-guest-id': guest },
      body: JSON.stringify({ email: 'lin@kurio.test', password: 'kurio-lin-2026' }),
    });
    const data = (await response.json()) as { session: { token: string } };
    return data.session.token;
  }, guestId as string);

  await page.evaluate((sessionToken) => {
    localStorage.setItem('kurio-session-token', sessionToken);
  }, token);

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(cartItems(page).getByRole('link', { name: 'Tide Archive', exact: true })).toBeVisible();
  await expect(cartItems(page).getByRole('link', { name: 'Aurora Signal', exact: true })).not.toBeVisible();
  await expect(cartLink(page)).toHaveAccessibleName(/1 item/);
});