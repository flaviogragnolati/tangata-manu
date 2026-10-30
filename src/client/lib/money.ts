const inputFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 2,
});

/**
 * Reads an es-AR amount as typed: `.` groups thousands and `,` is the decimal
 * separator. Empty text is `null`; anything else unreadable is `NaN`.
 */
export function parseMoney(text: string): number | null {
  const clean = text.replace(/[$\s]/g, '');
  if (!clean) return null;
  if (!/^[\d.]*(,\d*)?$/.test(clean)) return NaN;
  const value = Number(clean.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : NaN;
}

export function formatMoneyInput(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? inputFormatter.format(value)
    : '';
}

/** Whole-percent change from `base`, or `null` when it can't be computed. */
export function percentChange(value: number, base: number): number | null {
  if (!base || !Number.isFinite(value)) return null;
  return Math.round(((value - base) / base) * 100);
}
