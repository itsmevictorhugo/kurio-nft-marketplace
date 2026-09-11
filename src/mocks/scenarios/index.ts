import { applyMockScenario } from '@/mocks/database/mock-database';
import { mockScenarioNames, type MockScenarioName } from '@/mocks/scenarios/types';

export { mockScenarioNames, type MockScenarioName };

const SCENARIO_KEY = 'kurio.mock.scenario';

function isMockScenarioName(value: string | null): value is MockScenarioName {
  return Boolean(value && (mockScenarioNames as readonly string[]).includes(value));
}

function readStoredScenario(): MockScenarioName {
  try {
    const stored = sessionStorage.getItem(SCENARIO_KEY);
    return isMockScenarioName(stored) ? stored : 'default';
  } catch {
    return 'default';
  }
}

let activeScenario: MockScenarioName = readStoredScenario();

export function getMockScenario() {
  return activeScenario;
}

export function selectMockScenario(scenario: MockScenarioName) {
  activeScenario = scenario;
  applyMockScenario(scenario);
  try {
    sessionStorage.setItem(SCENARIO_KEY, scenario);
  } catch {
    // storage unavailable: scenario stays memory-only for this page life
  }
}

export function resetMockScenario() {
  activeScenario = 'default';
  try {
    sessionStorage.removeItem(SCENARIO_KEY);
  } catch {
    // ignore
  }
}
