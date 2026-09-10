import { describe, expect, it } from 'vitest';
import {
  addEthAmounts,
  compareEthAmounts,
  ethAmount,
  isEthAmount,
  multiplyEthAmount,
  percentageOfEthAmount,
  subtractEthAmounts,
} from '@/lib/money/eth';

describe('ETH amount boundary', () => {
  it('accepts decimal strings without converting them to floating-point numbers', () => {
    expect(ethAmount('0.000000000000000001')).toBe('0.000000000000000001');
    expect(isEthAmount('42.5')).toBe(true);
    expect(isEthAmount('1e-18')).toBe(false);
  });

  it('rejects malformed amounts', () => {
    expect(() => ethAmount('01.5')).toThrow();
    expect(() => ethAmount('-1')).toThrow();
    expect(() => ethAmount('1.')).toThrow();
    expect(() => ethAmount('.5')).toThrow();
    expect(() => ethAmount('0.0000000000000000001')).toThrow();
    expect(isEthAmount('')).toBe(false);
  });
});

describe('ETH arithmetic', () => {
  it('adds amounts without floating-point precision loss', () => {
    expect(addEthAmounts(ethAmount('1.25'), ethAmount('0.875'))).toBe('2.125');
    expect(
      addEthAmounts(ethAmount('0.000000000000000001'), ethAmount('0.000000000000000002')),
    ).toBe('0.000000000000000003');
    expect(addEthAmounts(ethAmount('0'), ethAmount('0'))).toBe('0');
  });

  it('subtracts amounts and refuses negative results', () => {
    expect(subtractEthAmounts(ethAmount('2.125'), ethAmount('0.125'))).toBe('2');
    expect(subtractEthAmounts(ethAmount('1'), ethAmount('1'))).toBe('0');
    expect(() => subtractEthAmounts(ethAmount('1'), ethAmount('2'))).toThrow();
  });

  it('multiplies amounts by integer quantities only', () => {
    expect(multiplyEthAmount(ethAmount('0.875'), 3)).toBe('2.625');
    expect(multiplyEthAmount(ethAmount('1.25'), 0)).toBe('0');
    expect(() => multiplyEthAmount(ethAmount('1'), 1.5)).toThrow();
    expect(() => multiplyEthAmount(ethAmount('1'), -1)).toThrow();
    expect(() => multiplyEthAmount(ethAmount('1'), Number.NaN)).toThrow();
  });

  it('floors percentage results at wei precision', () => {
    expect(percentageOfEthAmount(ethAmount('2.125'), 10)).toBe('0.2125');
    expect(percentageOfEthAmount(ethAmount('0.01'), 33)).toBe('0.0033');
    expect(percentageOfEthAmount(ethAmount('0.000000000000000001'), 50)).toBe('0');
    expect(() => percentageOfEthAmount(ethAmount('1'), 101)).toThrow();
    expect(() => percentageOfEthAmount(ethAmount('1'), 1.5)).toThrow();
  });

  it('compares amounts by numeric value rather than string order', () => {
    expect(compareEthAmounts(ethAmount('1.25'), ethAmount('0.875'))).toBe(1);
    expect(compareEthAmounts(ethAmount('0.875'), ethAmount('1.25'))).toBe(-1);
    expect(compareEthAmounts(ethAmount('1.5'), ethAmount('1.50'))).toBe(0);
  });
});
