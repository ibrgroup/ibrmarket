/** Формат суммы в рублях для админки и витрины */
export function formatRub(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return `${Math.round(Number(amount)).toLocaleString('ru-RU')}\u00A0\u20BD`;
}
