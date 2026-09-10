export type EthAmount = string & { readonly __ethAmount: unique symbol };

const ETH_AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function ethAmount(value: string): EthAmount {
  if (!ETH_AMOUNT_PATTERN.test(value)) {
    throw new Error('ETH amounts must be non-negative decimal strings.');
  }

  return value as EthAmount;
}

export function isEthAmount(value: string): value is EthAmount {
  return ETH_AMOUNT_PATTERN.test(value);
}
