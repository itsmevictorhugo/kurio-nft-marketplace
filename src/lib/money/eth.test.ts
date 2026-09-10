import { describe, expect, it } from 'vitest';
import { ethAmount, isEthAmount } from '@/lib/money/eth';

describe('ETH amount boundary', () => {
  it('accepts decimal strings without converting them to floating-point numbers', () => {
    expect(ethAmount('0.000000000000000001')).toBe('0.000000000000000001');
    expect(isEthAmount('42.5')).toBe(true);
    expect(isEthAmount('1e-18')).toBe(false);
  });
});
