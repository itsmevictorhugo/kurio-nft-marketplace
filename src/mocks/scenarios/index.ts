import { applyMockScenario } from '@/mocks/database/mock-database';
import { mockScenarioNames, type MockScenarioName } from '@/mocks/scenarios/types';

export { mockScenarioNames, type MockScenarioName };

let activeScenario: MockScenarioName = 'default';

export function getMockScenario() {
  return activeScenario;
}

export function selectMockScenario(scenario: MockScenarioName) {
  activeScenario = scenario;
  applyMockScenario(scenario);
}

export function resetMockScenario() {
  activeScenario = 'default';
}
