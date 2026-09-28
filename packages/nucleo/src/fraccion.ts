/**
 * Aritmética exacta con fracciones.
 *
 * Las islas superiores (7° y 8°) trabajan con coeficientes racionales:
 * nunca usamos decimales de punto flotante para decidir si una respuesta
 * es correcta (así nunca aparece un 0,30000000000000004).
 */

export interface Fraccion {
  readonly num: number;
  readonly den: number;
}

function mcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

function verificarSeguro(n: number): void {
  if (!Number.isSafeInteger(n)) throw new RangeError(`Entero fuera de rango seguro: ${n}`);
}

export function fraccion(num: number, den = 1): Fraccion {
  verificarSeguro(num);
  verificarSeguro(den);
  if (den === 0) throw new RangeError('Denominador cero');
  if (num === 0) return { num: 0, den: 1 };
  const signo = den < 0 ? -1 : 1;
  const g = mcd(num, den);
  return { num: (signo * num) / g, den: (signo * den) / g };
}

export const CERO = fraccion(0);
export const UNO = fraccion(1);

export const sumar = (a: Fraccion, b: Fraccion): Fraccion =>
  fraccion(a.num * b.den + b.num * a.den, a.den * b.den);

export const restar = (a: Fraccion, b: Fraccion): Fraccion =>
  fraccion(a.num * b.den - b.num * a.den, a.den * b.den);

export const multiplicar = (a: Fraccion, b: Fraccion): Fraccion =>
  fraccion(a.num * b.num, a.den * b.den);

export function dividir(a: Fraccion, b: Fraccion): Fraccion {
  if (b.num === 0) throw new RangeError('División por cero');
  return fraccion(a.num * b.den, a.den * b.num);
}

export const opuesto = (a: Fraccion): Fraccion => fraccion(-a.num, a.den);

export const iguales = (a: Fraccion, b: Fraccion): boolean => a.num === b.num && a.den === b.den;

/** −1, 0 o 1 según a < b, a = b o a > b. */
export function comparar(a: Fraccion, b: Fraccion): -1 | 0 | 1 {
  const d = a.num * b.den - b.num * a.den;
  return d < 0 ? -1 : d > 0 ? 1 : 0;
}

export const esEntera = (a: Fraccion): boolean => a.den === 1;

export function aTexto(a: Fraccion): string {
  return a.den === 1 ? String(a.num).replace('-', '−') : `${a.num < 0 ? '−' : ''}${Math.abs(a.num)}/${a.den}`;
}

/** Interpreta "3", "-2", "3/4", "−1/2" o "1,5". Devuelve null si no es válido. */
export function desdeTexto(texto: string): Fraccion | null {
  const t = texto.trim().replace('−', '-').replace(',', '.');
  if (/^-?\d{1,9}$/.test(t)) return fraccion(Number(t));
  const m = /^(-?\d{1,9})\/(\d{1,9})$/.exec(t);
  if (m) {
    const den = Number(m[2]);
    return den === 0 ? null : fraccion(Number(m[1]), den);
  }
  const d = /^(-?)(\d{1,6})\.(\d{1,6})$/.exec(t);
  if (d) {
    const escala = 10 ** (d[3] as string).length;
    const valor = Number(d[2]) * escala + Number(d[3]);
    return fraccion((d[1] === '-' ? -1 : 1) * valor, escala);
  }
  return null;
}
