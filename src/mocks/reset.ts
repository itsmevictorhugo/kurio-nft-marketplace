import { resetMockDatabase } from '@/mocks/database/mock-database';
import { resetMockScenario } from '@/mocks/scenarios';

export function resetMockState() {
  resetMockDatabase();
  resetMockScenario();
}
