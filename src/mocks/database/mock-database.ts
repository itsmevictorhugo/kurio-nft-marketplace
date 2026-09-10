export interface MockDatabase {
  scenario: string;
}

function createMockDatabase(): MockDatabase {
  return { scenario: 'default' };
}

let mockDatabase = createMockDatabase();

export function getMockDatabase() {
  return mockDatabase;
}

export function resetMockDatabase() {
  mockDatabase = createMockDatabase();
}
