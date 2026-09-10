import { HttpResponse, http } from 'msw';
import { domainHandlers } from '@/mocks/handlers/domain-handlers';

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  ...domainHandlers,
];
