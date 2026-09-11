import { compareEthAmounts } from '@/lib/money/eth';
import type { EthAmount } from '@/lib/money/eth';
import type { Quote } from '@/types/domain';

export interface CheckoutTotals {
  subtotal: EthAmount;
  discount: EthAmount;
  networkFee: EthAmount;
  total: EthAmount;
}

export interface CheckoutAttempt {
  /** Stable intent id: survives retries and refreshes; drives the idempotency key. */
  attemptId: string;
  quoteId: string;
  couponCode: string | undefined;
  totals: CheckoutTotals;
}

function storageKey(token: string) {
  return `kurio-checkout-attempt:${token}`;
}

export function quoteTotals(quote: Quote): CheckoutTotals {
  return {
    subtotal: quote.subtotal,
    discount: quote.discount,
    networkFee: quote.networkFee,
    total: quote.total,
  };
}

export function totalsMatch(left: CheckoutTotals, right: CheckoutTotals) {
  return (
    compareEthAmounts(left.subtotal, right.subtotal) === 0 &&
    compareEthAmounts(left.discount, right.discount) === 0 &&
    compareEthAmounts(left.networkFee, right.networkFee) === 0 &&
    compareEthAmounts(left.total, right.total) === 0
  );
}

export function createAttemptId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * The idempotency key is derived from the stable attempt id, never from the
 * transient quote id, so a request retried after a 504 (or after a refresh,
 * since the attempt is persisted) hits exactly one order on the server.
 */
export function buildIdempotencyKey(attemptId: string) {
  return `checkout-${attemptId}`;
}

export function readCheckoutAttempt(token: string): CheckoutAttempt | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(token));
    if (!raw) {
      return null;
    }
    const attempt = JSON.parse(raw) as CheckoutAttempt;
    if (!attempt.attemptId || !attempt.quoteId || !attempt.totals) {
      return null;
    }
    return attempt;
  } catch {
    return null;
  }
}

export function writeCheckoutAttempt(token: string, attempt: CheckoutAttempt): void {
  try {
    window.sessionStorage.setItem(storageKey(token), JSON.stringify(attempt));
  } catch {
    // storage unavailable: the intent still lives for this page session
  }
}

export function clearCheckoutAttempt(token: string): void {
  try {
    window.sessionStorage.removeItem(storageKey(token));
  } catch {
    // ignore
  }
}