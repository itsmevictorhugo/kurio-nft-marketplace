import { HttpResponse, http } from 'msw';
import { domainHandlers } from '@/mocks/handlers/domain-handlers';
import { persistMockDatabase } from '@/mocks/database/mock-database';
import { resetMockState } from '@/mocks/reset';
import { selectMockScenario, type MockScenarioName } from '@/mocks/scenarios';

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  ...domainHandlers,
  // Mock-only control endpoints used by development tooling and Playwright
  // to start each scenario from isolated, deterministic state. They belong to
  // the mock layer only and are never referenced by application code.
  http.post('/api/__mock/reset', () => {
    resetMockState();
    return HttpResponse.json({ ok: true });
  }),
  http.post('/api/__mock/scenario', async ({ request }) => {
    const body = (await request.json()) as { scenario?: MockScenarioName };
    if (body.scenario) {
      selectMockScenario(body.scenario);
      persistMockDatabase();
      return HttpResponse.json({ ok: true });
    }
    return HttpResponse.json({ ok: false }, { status: 400 });
  }),
];