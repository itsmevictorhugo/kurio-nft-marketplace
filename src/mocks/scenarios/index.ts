import { getMockDatabase, resetMockDatabase } from '@/mocks/database/mock-database';

export const foundationScenarios = ['default'] as const;
export type FoundationScenario = (typeof foundationScenarios)[number];

export function selectMockScenario(scenario: FoundationScenario) {
  getMockDatabase().scenario = scenario;
}

export function resetMockScenario() {
  resetMockDatabase();
}
