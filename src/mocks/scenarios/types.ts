export const mockScenarioNames = [
  'default',
  'empty-catalog',
  'latency',
  'network-error',
  'client-error',
  'server-error',
  'session-expired',
  'sold-out',
  'price-changed',
  'coupon-accepted',
  'coupon-rejected',
  'order-pending',
  'payment-confirmed',
  'payment-rejected',
  'order-timeout',
] as const;

export type MockScenarioName = (typeof mockScenarioNames)[number];
