export type EthAmount = string & { readonly __ethAmount: unique symbol };

const ETH_AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;
const WEI_PER_ETH = 10n ** 18n;

export function ethAmount(value: string): EthAmount {
  if (!ETH_AMOUNT_PATTERN.test(value)) {
    throw new Error('ETH amounts must be non-negative decimal strings.');
  }

  return value as EthAmount;
}

export function isEthAmount(value: string): value is EthAmount {
  return ETH_AMOUNT_PATTERN.test(value);
}

function toWei(value: EthAmount): bigint {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(18, '0'));
}

function fromWei(value: bigint): EthAmount {
  const whole = value / WEI_PER_ETH;
  const fraction = (value % WEI_PER_ETH).toString().padStart(18, '0').replace(/0+$/, '');
  return ethAmount(fraction ? `${whole}.${fraction}` : whole.toString());
}

export function addEthAmounts(...values: EthAmount[]): EthAmount {
  return fromWei(values.reduce((total, value) => total + toWei(value), 0n));
}

export function subtractEthAmounts(minuend: EthAmount, subtrahend: EthAmount): EthAmount {
  const result = toWei(minuend) - toWei(subtrahend);
  if (result < 0n) {
    throw new Error('ETH amount cannot be negative.');
  }

  return fromWei(result);
}

export function multiplyEthAmount(value: EthAmount, multiplier: number): EthAmount {
  if (!Number.isSafeInteger(multiplier) || multiplier < 0) {
    throw new Error('ETH multipliers must be non-negative integers.');
  }

  return fromWei(toWei(value) * BigInt(multiplier));
}

export function percentageOfEthAmount(value: EthAmount, percentage: number): EthAmount {
  if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) {
    throw new Error('ETH percentage must be an integer between 0 and 100.');
  }

  return fromWei((toWei(value) * BigInt(percentage)) / 100n);
}

export function compareEthAmounts(left: EthAmount, right: EthAmount): number {
  return toWei(left) === toWei(right) ? 0 : toWei(left) > toWei(right) ? 1 : -1;
}
