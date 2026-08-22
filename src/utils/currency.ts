// Ghana Cedi Currency Formatter Utility
export const CURRENCY_SYMBOL = 'GH₵';

export function formatCedi(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${CURRENCY_SYMBOL}0.00`;
  }
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
