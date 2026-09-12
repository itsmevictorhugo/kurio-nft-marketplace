import { expect, test, type Page } from '@playwright/test';

const ADA_EMAIL = 'ada@kurio.test';
const ADA_PASSWORD = 'kurio-ada-2026';

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

test.beforeEach(async ({ page }) => {
  await resetMockState(page);
});

test.describe('Profile', () => {
  test('PROFILE-01: view profile when authenticated', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'Perfil do Colecionador' })).toBeVisible();
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ada Collector');
  });

  test('PROFILE-02: edit profile display name and bio', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/profile');

    await page.getByLabel('Nome de exibição').fill('Ada Updated');
    await page.getByLabel('Bio').fill('Nova bio de teste');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByText('Perfil atualizado com sucesso.')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ada Updated');
    await expect(page.getByLabel('Bio')).toHaveValue('Nova bio de teste');
  });

  test('PROFILE-03: update avatar URL', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/profile');

    await page.getByLabel('URL do Avatar').fill('https://example.com/new-avatar.png');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByText('Perfil atualizado com sucesso.')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('URL do Avatar')).toHaveValue('https://example.com/new-avatar.png');

    // Check avatar preview
    const avatarImg = page.locator('section').filter({ hasText: 'Pré-visualização do Avatar' }).locator('img');
    await expect(avatarImg).toHaveAttribute('src', 'https://example.com/new-avatar.png');
  });

  test('PROFILE-04: password change validation', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/profile');

    // Submit empty password form
    await page.getByRole('button', { name: 'Alterar senha' }).click();

    await expect(page.getByText('Senha atual é obrigatória.')).toBeVisible();
    await expect(page.getByText('A nova senha deve ter pelo menos 8 caracteres.')).toBeVisible();
  });

  test('PROFILE-04: password mismatch error', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/profile');

    await page.getByLabel('Senha atual').fill('senha123');
    await page.locator('#profile-newPassword').fill('nova1234');
    await page.locator('#profile-confirmPassword').fill('diferente123');
    await page.getByRole('button', { name: 'Alterar senha' }).click();

    await expect(page.getByText('As senhas não conferem.')).toBeVisible();
  });

  test('PROFILE-04: successful password change', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/profile');

    await page.getByLabel('Senha atual').fill('kurio-ada-2026');
    await page.locator('#profile-newPassword').fill('nova-senha-123');
    await page.locator('#profile-confirmPassword').fill('nova-senha-123');
    await page.getByRole('button', { name: 'Alterar senha' }).click();

    await expect(page.getByText('Senha alterada com sucesso.')).toBeVisible({ timeout: 5000 });
  });

  test('PROFILE-05: validation errors for invalid inputs', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/profile');

    await page.getByLabel('Nome de exibição').fill('A');
    await page.getByLabel('Bio').fill('a'.repeat(500)); // maxLength prevents >500
    await page.getByLabel('URL do Avatar').fill('invalid-url');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    // Wait for validation to complete
    await page.waitForTimeout(100);

    await expect(page.getByText('Nome deve ter pelo menos 2 caracteres.')).toBeVisible();
    await expect(page.getByText('URL do avatar inválida.')).toBeVisible();
    // Bio is limited to 500 chars by maxLength, verify counter shows 500/500
    await expect(page.getByText('500/500')).toBeVisible();
  });

  test('PROFILE-06: persistence after refresh', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/profile');

    await page.getByLabel('Nome de exibição').fill('Ada Persistida');
    await page.getByLabel('Bio').fill('Bio persistida');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByText('Perfil atualizado com sucesso.')).toBeVisible({ timeout: 5000 });

    await page.reload();

    await expect(page.getByRole('heading', { name: 'Perfil do Colecionador' })).toBeVisible();
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ada Persistida');
    await expect(page.getByLabel('Bio')).toHaveValue('Bio persistida');
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
  });
});

test.describe('Wallets', () => {
  test('WALLET-01: list wallets when authenticated', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/wallets');

    await expect(page.getByRole('heading', { name: 'Carteiras', exact: true })).toBeVisible();
    await expect(page.getByText('Ada primary')).toBeVisible();
    await expect(page.getByText('Ada secondary')).toBeVisible();
    await expect(page.getByText('Principal')).toBeVisible();
  });

  test('WALLET-04: add wallet', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/wallets');

    await page.getByRole('button', { name: 'Adicionar carteira' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nova Carteira' })).toBeVisible();

    await page.getByLabel('Rótulo').fill('Nova Carteira Teste');
    // Use a unique address not in the mock data (Ada has 0x1111... and 0x2222...)
    await page.getByLabel('Endereço').fill('0x3333333333333333333333333333333333333333');
    await page.getByRole('button', { name: 'Adicionar carteira' }).last().click();

    // Wait for mutation to complete and toast to appear
    await expect(page.getByText('Carteira adicionada com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Nova Carteira Teste')).toBeVisible({ timeout: 5000 });
  });

  test('WALLET-05: edit wallet', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/wallets');

    const editButtons = page.getByRole('button', { name: /Editar/ });
    await editButtons.first().click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Editar Carteira' })).toBeVisible();

    await page.getByLabel('Rótulo').fill('Carteira Editada');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByText('Carteira atualizada com sucesso.')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Carteira Editada')).toBeVisible({ timeout: 5000 });
  });

test('WALLET-02: set primary wallet', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/wallets');

    // The second wallet should not be primary initially
    const walletCards = page.locator('section').filter({ hasText: 'Ada secondary' });
    await expect(walletCards.locator('text=Principal')).not.toBeVisible();

    // Edit the second wallet and set as primary
    const editButtons = page.getByRole('button', { name: /Editar/ });
    await editButtons.nth(1).click();

    await page.getByLabel('Definir como carteira principal').check();

    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByText('Carteira atualizada com sucesso.')).toBeVisible({ timeout: 5000 });

    // Reload page to force refetch of wallets
    await page.reload();

    // Now the second wallet should be primary
    const secondaryCard = page.locator('div.rounded-md.bg-kurio-surface').filter({ hasText: 'Ada secondary' });
    await expect(secondaryCard.getByText('Principal', { exact: true })).toBeVisible({ timeout: 10000 });
    // The first wallet should no longer be primary
    const primaryCard = page.locator('div.rounded-md.bg-kurio-surface').filter({ hasText: 'Ada primary' });
    await expect(primaryCard.getByText('Principal', { exact: true })).not.toBeVisible({ timeout: 10000 });
  });

  test('WALLET-06: validation errors for invalid wallet data', async ({ page }) => {
    await login(page, ADA_EMAIL, ADA_PASSWORD);
    await page.goto('/wallets');

    await page.getByRole('button', { name: 'Adicionar carteira' }).first().click();
    await page.getByRole('button', { name: 'Adicionar carteira' }).last().click();

    await expect(page.getByText('Rótulo deve ter pelo menos 2 caracteres.')).toBeVisible();
    await expect(page.getByText('Endereço deve ser um endereço Ethereum válido (0x...).')).toBeVisible();
  });

  test('WALLET-01: empty state when no wallets', async ({ page }) => {
    // Create a new user with no wallets by registering
    await page.goto('/register');
    await page.getByLabel('Email').fill('empty@test.com');
    await page.getByLabel('Nome de exibição').fill('Empty User');
    await page.getByLabel('Senha').fill('senha-123456');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    // Wait for registration to complete and redirect
    await page.waitForURL('/');

    await page.goto('/wallets');

    await expect(page.getByRole('heading', { name: 'Carteiras', exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Nenhuma carteira cadastrada')).toBeVisible({ timeout: 5000 });
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/wallets');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
  });
});