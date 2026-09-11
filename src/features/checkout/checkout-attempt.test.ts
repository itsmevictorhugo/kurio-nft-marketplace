import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ethAmount } from '@/lib/money/eth';
import {
  buildIdempotencyKey,
  clearCheckoutAttempt,
  createAttemptId,
  quoteTotals,
  readCheckoutAttempt,
  totalsMatch,
  writeCheckoutAttempt,
  type CheckoutAttempt,
} from './checkout-attempt';

const TOKEN = 'test-token';

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
});

function makeAttempt(overrides: Partial<CheckoutAttempt> = {}): CheckoutAttempt {
  return {
    attemptId: 'attempt-123',
    quoteId: 'quote-abc',
    couponCode: undefined,
    totals: {
      subtotal: ethAmount('2.125'),
      discount: ethAmount('0'),
      networkFee: ethAmount('0.003'),
      total: ethAmount('2.128'),
    },
    ...overrides,
  };
}

describe('quoteTotals', () => {
  it('extracts the four monetary fields from a quote', () => {
    const totals = quoteTotals({
      id: 'q-1',
      ownerId: 'u-1',
      items: [],
      subtotal: ethAmount('1.5'),
      discount: ethAmount('0.15'),
      networkFee: ethAmount('0.003'),
      total: ethAmount('1.353'),
      createdAt: '2026-01-15T00:00:00.000Z',
    } as never);
    expect(totals).toEqual({
      subtotal: '1.5',
      discount: '0.15',
      networkFee: '0.003',
      total: '1.353',
    });
  });
});

describe('totalsMatch', () => {
  it('returns true when all four monetary fields are equal', () => {
    const a = makeAttempt().totals;
    const b = makeAttempt().totals;
    expect(totalsMatch(a, b)).toBe(true);
  });

  it('returns false when a single field differs', () => {
    const a = makeAttempt().totals;
    const b = makeAttempt({ totals: { ...a, total: ethAmount('9.999') } }).totals;
    expect(totalsMatch(a, b)).toBe(false);
  });
});

describe('createAttemptId', () => {
  it('generates a unique value each call', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createAttemptId()));
    expect(ids.size).toBe(50);
  });
});

describe('buildIdempotencyKey', () => {
  it('is deterministic for the same attempt id', () => {
    expect(buildIdempotencyKey('attempt-1')).toBe(buildIdempotencyKey('attempt-1'));
  });

  it('differs for different attempt ids', () => {
    expect(buildIdempotencyKey('attempt-1')).not.toBe(buildIdempotencyKey('attempt-2'));
  });

  it('does not embed the quote id', () => {
    const key = buildIdempotencyKey('attempt-xyz');
    expect(key).not.toContain('quote');
    expect(key).toMatch(/^checkout-/);
  });
});

describe('checkout attempt storage', () => {
  it('writes and reads an attempt', () => {
    const attempt = makeAttempt();
    writeCheckoutAttempt(TOKEN, attempt);
    expect(readCheckoutAttempt(TOKEN)).toEqual(attempt);
  });

  it('returns null when no attempt is stored', () => {
    expect(readCheckoutAttempt('missing')).toBeNull();
  });

  it('returns null for corrupted data', () => {
    sessionStorage.setItem('kurio-checkout-attempt:test-token', 'not-json');
    expect(readCheckoutAttempt(TOKEN)).toBeNull();
  });

  it('clears the stored attempt', () => {
    writeCheckoutAttempt(TOKEN, makeAttempt());
    clearCheckoutAttempt(TOKEN);
    expect(readCheckoutAttempt(TOKEN)).toBeNull();
  });

  it('isolates attempts by token', () => {
    writeCheckoutAttempt('token-a', makeAttempt({ quoteId: 'a' }));
    writeCheckoutAttempt('token-b', makeAttempt({ quoteId: 'b' }));
    expect(readCheckoutAttempt('token-a')?.quoteId).toBe('a');
    expect(readCheckoutAttempt('token-b')?.quoteId).toBe('b');
    clearCheckoutAttempt('token-a');
    expect(readCheckoutAttempt('token-a')).toBeNull();
    expect(readCheckoutAttempt('token-b')).not.toBeNull();
  });
});
