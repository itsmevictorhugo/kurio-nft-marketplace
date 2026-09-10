import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { apiClient } from '@/lib/axios/api-client';
import { resetMockState } from '@/mocks/reset';
import { server } from '@/mocks/server';

apiClient.defaults.baseURL = 'http://localhost/api';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetMockState();
});
afterAll(() => server.close());
