import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'https://kurio-nft-marketplace.vercel.app';

type Issue = { type: 'pageerror' | 'console' | 'requestfailed'; detail: string };

function collectIssues(page: Page): Issue[] {
  const issues: Issue[] = [];
  page.on('pageerror', (error) => issues.push({ type: 'pageerror', detail: error.message }));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!/favicon/i.test(text)) {
        issues.push({ type: 'console', detail: text });
      }
    }
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!/favicon/i.test(url)) {
      issues.push({ type: 'requestfailed', detail: `${request.method()} ${url} ${request.failure()?.errorText ?? ''}`.trim() });
    }
  });
  return issues;
}

async function inPageFetch(page: Page, url: string, init?: RequestInit): Promise<{ status: number; body: string }> {
  // Runs inside the page, so the mock layer (MSW in the published build)
  // intercepts `/api/*` the same way a real user's browser would.
  return page.evaluate(
    async ({ targetUrl, options }: { targetUrl: string; options?: RequestInit }) => {
      const response = await fetch(targetUrl, options);
      return { status: response.status, body: await response.text() };
    },
    { targetUrl: url, options: init },
  );
}

test('home loads and renders the catalog', async ({ page }) => {
  const issues = collectIssues(page);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('link', { name: 'KURIO' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Seja dono do futuro da arte digital' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Resultados do catálogo' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Resultados do catálogo' }).getByRole('link', { name: /Emerald Ape/ })).toBeVisible();
  expect(issues.filter((issue) => issue.type === 'pageerror').length).toBe(0);
});

test('nft detail loads by direct URL and survives refresh', async ({ page }) => {
  const issues = collectIssues(page);
  await page.goto(`${BASE_URL}/nfts/nft-aurora`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Aurora Signal' })).toBeVisible();
  await expect(page.getByText('1.25 ETH').first()).toBeVisible();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Aurora Signal' })).toBeVisible();
  expect(issues.filter((issue) => issue.type === 'pageerror').length).toBe(0);
});

test('login works and keeps the session across reloads', async ({ page }) => {
  const issues = collectIssues(page);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('ada@kurio.test');
  await page.getByLabel('Senha').fill('kurio-ada-2026');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
  await expect(page.getByRole('button', { name: 'Menu do usuário Ada Collector' })).toBeVisible();
  const token = await page.evaluate(() => localStorage.getItem('kurio-session-token'));
  expect(token).toBeTruthy();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: 'Menu do usuário Ada Collector' })).toBeVisible();
  expect(issues.filter((issue) => issue.type === 'pageerror').length).toBe(0);
});

test('cart flow works: add from detail, item and page render', async ({ page }) => {
  const issues = collectIssues(page);
  await page.goto(`${BASE_URL}/nfts/nft-aurora`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Aurora Signal' })).toBeVisible();
  await page.getByRole('button', { name: 'Comprar' }).click();
  await expect(page.getByText('Aurora Signal adicionado ao carrinho.')).toBeVisible();
  await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.getByText('Aurora Signal').first()).toBeVisible();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  expect(issues.filter((issue) => issue.type === 'pageerror').length).toBe(0);
});

test('profile and wallets load for the authenticated user', async ({ page }) => {
  const issues = collectIssues(page);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('ada@kurio.test');
  await page.getByLabel('Senha').fill('kurio-ada-2026');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Menu do usuário Ada Collector' })).toBeVisible();

  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Perfil do Colecionador' })).toBeVisible();
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ada Collector');

  await page.goto(`${BASE_URL}/wallets`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Carteiras', exact: true })).toBeVisible();
  await expect(page.getByText('Ada primary')).toBeVisible();
  await expect(page.getByText(/0x1111/i).first()).toBeVisible();
  expect(issues.filter((issue) => issue.type === 'pageerror').length).toBe(0);
});

test('checkout (payment screen) is reachable when authenticated', async ({ page }) => {
  const issues = collectIssues(page);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('ada@kurio.test');
  await page.getByLabel('Senha').fill('kurio-ada-2026');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Menu do usuário Ada Collector' })).toBeVisible();

  await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Finalizar compra' })).toBeVisible();
  expect(issues.filter((issue) => issue.type === 'pageerror').length).toBe(0);
});

test('realtime and mock control path work in the published build', async ({ page }) => {
  const issues = collectIssues(page);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const catalog = page.getByRole('list', { name: 'Resultados do catálogo' });
  const auroraCard = catalog.getByRole('link', { name: /Aurora Signal/ });
  await expect(auroraCard).toBeVisible();

  // The Socket.IO client connects lazily (dynamic import), so wait for the
  // mock hub to register the WebSocket connection before asserting.
  await page.waitForFunction(
    async (targetUrl) => {
      const response = await fetch(`${targetUrl}/api/__mock/socket/connections`);
      const body = (await response.json()) as { connections: number };
      return body.connections >= 1;
    },
    BASE_URL,
    { timeout: 15000 },
  );

  const connections = await inPageFetch(page, `${BASE_URL}/api/__mock/socket/connections`);
  expect(connections.status).toBe(200);
  expect(JSON.parse(connections.body).connections).toBeGreaterThanOrEqual(1);

  const scenario = await inPageFetch(page, `${BASE_URL}/api/__mock/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: 'price-changed' }),
  });
  expect(scenario.status).toBe(200);

  await expect(auroraCard.getByText('1.5 ETH')).toBeVisible();
  expect(issues.filter((issue) => issue.type === 'pageerror').length).toBe(0);
});

test('assets, fonts and the MSW worker are served', async ({ request }) => {
  const checks = [
    { url: `${BASE_URL}/assets/nft/nft-artwork-10.png`, expectType: 'image/png' },
    { url: `${BASE_URL}/fonts/roboto-mono-latin.woff2`, expectType: 'font/woff2' },
    { url: `${BASE_URL}/mockServiceWorker.js`, expectType: 'javascript' },
  ];
  for (const check of checks) {
    const response = await request.get(check.url);
    expect(response.status(), check.url).toBe(200);
    expect(response.headers()['content-type'] ?? '', check.url).toContain(check.expectType);
  }
});

test('MSW REST layer resolves through the mock in the browser', async ({ page }) => {
  const issues = collectIssues(page);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const health = await inPageFetch(page, `${BASE_URL}/api/health`);
  expect(health.status).toBe(200);
  expect(JSON.parse(health.body)).toEqual({ status: 'ok' });
  const nfts = await inPageFetch(page, `${BASE_URL}/api/nfts`);
  expect(nfts.status).toBe(200);
  expect(JSON.parse(nfts.body).items.length).toBeGreaterThan(0);
  expect(issues.filter((issue) => issue.type === 'pageerror').length).toBe(0);
});