/** Utilidades de texto para expresiones lineales con signo (8° básico). */

/** Término con x: "3x", "−x", "+ 2x", "− 5x" (vacío si el coeficiente es 0). */
export function terminoX(coef: number, L: string, primero: boolean): string {
  if (coef === 0) return '';
  const abs = Math.abs(coef);
  const cuerpo = abs === 1 ? L : `${abs}${L}`;
  if (primero) return coef < 0 ? `−${cuerpo}` : cuerpo;
  return `${coef < 0 ? '−' : '+'} ${cuerpo}`;
}

/** Constante: "7", "−3", "+ 7", "− 3" (vacío si es 0 y no va primero). */
export function constante(n: number, primero: boolean): string {
  if (primero) return n < 0 ? `−${-n}` : String(n);
  if (n === 0) return '';
  return `${n < 0 ? '−' : '+'} ${Math.abs(n)}`;
}

/** "3x + 4", "−x", "2x − 5", "7" … */
export function lineal(a: number, b: number, L: string): string {
  if (a === 0) return constante(b, true);
  return [terminoX(a, L, true), constante(b, false)].filter(Boolean).join(' ');
}

/** Número con signo tipográfico: −4. */
export const num = (n: number): string => (n < 0 ? `−${-n}` : String(n));

/** Número entre paréntesis si es negativo: (−4). */
export const numP = (n: number): string => (n < 0 ? `(−${-n})` : String(n));
