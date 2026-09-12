import { expect, test, type Page } from '@playwright/test';

const ADA_EMAIL = 'ada@kurio.test';
const ADA_PASSWORD = 'kurio-ada-2026';
const LIN_EMAIL = 'lin@kurio.test';
const LIN_PASSWORD = 'kurio-lin-2026';

async function resetMockState(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
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
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const ok = await page.evaluate(async (name) => {
      try {
        const response = await fetch('/api/__mock/scenario', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ scenario: name }),
        });
        return response.ok;
      } catch {
        return false;
      }
    }, scenario);
    if (ok) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Unable to select scenario ${scenario}.`);
}

async function login(page: Page, email: string, password: string) {
  if (!new URL(page.url()).pathname.startsWith('/login')) {
    await page.goto('/login');
  }
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  // Wait for session query to complete
  await page.waitForResponse(
    (response) =>
      response.url().includes('/api/auth/session') && response.status() === 200,
    { timeout: 15000 },
  );
}

async function register(
  page: Page,
  email: string,
  displayName: string,
  password: string,
) {
  if (!new URL(page.url()).pathname.startsWith('/register')) {
    await page.goto('/register');
  }
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Nome de exibição').fill(displayName);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Cadastrar' }).click();
}

test.beforeEach(async ({ page }) => {
  await resetMockState(page);
});

test.describe('Registration', () => {
  test('AUTH-01: registers a new user successfully', async ({ page }) => {
    await register(page, 'novo@teste.com', 'Novo Usuario', 'nova-senha-123');

    // Home has different composition between desktop and mobile.
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('AUTH-02: rejects empty fields', async ({ page }) => {
    await page.goto('/register');

    await expect(
      page.getByRole('heading', { name: 'Criar sua conta' }),
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Cadastrar' }),
    ).toBeDisabled();
  });

  test('AUTH-02: shows validation errors for invalid email, short name, short password', async ({
    page,
  }) => {
    await page.goto('/register');

    await expect(
      page.getByRole('heading', { name: 'Criar sua conta' }),
    ).toBeVisible();

    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Nome de exibição').fill('A');
    await page.getByLabel('Senha').fill('short');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page.getByText('Email inválido.')).toBeVisible();

    await expect(
      page.getByText('Nome deve ter pelo menos 2 caracteres.'),
    ).toBeVisible();

    await expect(
      page.getByText('A senha deve ter pelo menos 8 caracteres.'),
    ).toBeVisible();
  });

  test('AUTH-03: rejects duplicate email with conflict error', async ({
    page,
  }) => {
    await register(page, ADA_EMAIL, 'Outro Usuario', 'outra-senha-123');

    await expect(
      page.getByText('Já existe uma conta com este email.'),
    ).toBeVisible();
  });

  test('AUTH-01: redirects to checkout when redirect param is present', async ({
    page,
  }) => {
    await page.goto('/register?redirect=/checkout');

    await expect(
      page.getByRole('heading', { name: 'Criar sua conta' }),
    ).toBeVisible();

    await register(page, 'checkout@test.com', 'Checkout User', 'senha-123456');

    // New user has empty cart, so checkout shows empty cart message.
    await expect(
      page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
    ).toBeVisible();
  });
});

test.describe('Login', () => {
  test('AUTH-04: logs in successfully', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);

    // Home has different composition between desktop and mobile.
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('AUTH-04: redirects to checkout when redirect param is present', async ({
    page,
  }) => {
    await page.goto('/login?redirect=/checkout');

    await login(page, ADA_EMAIL, ADA_PASSWORD);

    await expect(
      page.getByRole('heading', { name: 'Finalizar compra' }),
    ).toBeVisible();
  });

  test('AUTH-04: redirects to order when redirect param points to an order', async ({
    page,
  }) => {
    await page.goto('/login?redirect=/order/order-99');

    await login(page, ADA_EMAIL, ADA_PASSWORD);

    await expect(
      page.getByRole('heading', { name: 'Pedido não encontrado' }),
    ).toBeVisible();
  });

  test('AUTH-04: rejects malicious redirect and falls back to home', async ({
    page,
  }) => {
    await page.goto('/login?redirect=https://evil.com');

    await login(page, ADA_EMAIL, ADA_PASSWORD);

    // Home has different composition between desktop and mobile.
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Session Persistence', () => {
  test('AUTH-05: session persists after page refresh', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);

    await page.reload();

    await expect(page.getByRole('main')).toContainText(
      'Seja dono do futuro da arte digital',
    );
  });
});

test.describe('Session Expiration', () => {
  test('AUTH-06: redirects to login on session expiration during navigation', async ({
    page,
  }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);

    await setScenario(page, 'session-expired');

    await page.goto('/checkout');

    await expect(
      page.getByText('Sua sessão expirou. Faça login novamente.').first(),
    ).toBeVisible({ timeout: 10000 });

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Logout', () => {
  test('AUTH-07: logs out and clears session', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);

    await expect(
      page
        .getByRole('button', { name: /Menu do usuário/i })
        .locator(':visible')
        .first(),
    ).toBeVisible({ timeout: 15000 });

    const userMenu = page
      .getByRole('button', { name: /Menu do usuário/i })
      .locator(':visible')
      .first();

    await expect(userMenu).toBeVisible({ timeout: 5000 });

    await userMenu.click();

    await page.getByRole('menuitem', { name: 'Sair' }).click();

    await expect(
      page
        .getByRole('button', { name: /Menu do usuário/i })
        .locator(':visible')
        .first(),
    ).toBeVisible({ timeout: 15000 });

    // After logout, the "Entrar" link should be visible on both desktop and mobile.
    // Home has different hero headings between desktop ("Seja dono do futuro da arte digital")
    // and mobile ("Seja dono da cultura digital"), so we verify the common auth state.
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible({
      timeout: 5000,
    });
  });

  test('AUTH-07: logout clears private caches (cart isolation)', async ({
    page,
  }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);

    await page.goto('/cart');

    await expect(page.getByText('Aurora Signal')).toBeVisible();

    await expect(
      page
        .getByRole('button', { name: /Menu do usuário/i })
        .locator(':visible')
        .first(),
    ).toBeVisible({ timeout: 15000 });

    const userMenu = page
      .getByRole('button', { name: /Menu do usuário/i })
      .locator(':visible')
      .first();

    await expect(userMenu).toBeVisible({ timeout: 5000 });

    await userMenu.click();

    await page.getByRole('menuitem', { name: 'Sair' }).click();

    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible({
      timeout: 5000,
    });

    await page.goto('/cart');

    await expect(
      page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('User Switching', () => {
  test('AUTH-08: switching users isolates private data', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);

    await page.goto('/cart');

    await expect(page.getByText('Aurora Signal')).toBeVisible();

    await expect(
      page
        .getByRole('button', { name: /Menu do usuário/i })
        .locator(':visible')
        .first(),
    ).toBeVisible({ timeout: 15000 });

    const userMenu = page
      .getByRole('button', { name: /Menu do usuário/i })
      .locator(':visible')
      .first();

    await expect(userMenu).toBeVisible({ timeout: 5000 });

    await userMenu.click();

    await page.getByRole('menuitem', { name: 'Sair' }).click();

    await login(page, LIN_EMAIL, LIN_PASSWORD);

    await page.goto('/cart');

    await expect(
      page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
    ).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Aurora Signal')).not.toBeVisible();
  });
});
