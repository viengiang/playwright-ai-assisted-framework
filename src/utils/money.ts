/**
 * Money helpers. Amounts are compared in integer cents to avoid floating-point drift
 * (e.g. 515.5 - 25.1 !== 490.4 in IEEE-754).
 */

export const toCents = (amount: number): number => Math.round(amount * 100);

/**
 * Formats cents the way ParaBank's UI renders money (its `formatCurrency` uses `toFixed(2)`:
 * no thousands separator, sign before the symbol), e.g. 123450 -> "$1234.50", -500 -> "-$5.00".
 */
export const formatUsd = (cents: number): string => {
  if (!Number.isInteger(cents)) {
    throw new RangeError(`formatUsd expects integer cents, got ${String(cents)}`);
  }
  const abs = Math.abs(cents);
  const amount = `${String(Math.floor(abs / 100))}.${String(abs % 100).padStart(2, '0')}`;
  return `${cents < 0 ? '-' : ''}$${amount}`;
};
