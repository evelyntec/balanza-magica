/**
 * Modelo de la balanza y utilidades de expresiones.
 *
 * Reglas físicas coherentes (ver docs/didactica.md):
 *  1. Siempre baja el lado más pesado.
 *  2. La inclinación crece con la diferencia, con un mínimo visible
 *     (una diferencia de 1 se nota) y un máximo (el brazo topa).
 *  3. Objetos iguales pesan lo mismo; un cubo pesa 1.
 */

import type { Expresion, Inclinacion, Objeto, ResultadoPesada, Signo, Termino } from './tipos';

export const ANGULO_MINIMO = 5;
export const ANGULO_MAXIMO = 20;
/** Diferencia a partir de la cual la balanza topa. */
export const DIFERENCIA_TOPE = 10;

/** Peso de un objeto. La caja pesa lo que se haya puesto dentro. */
export function pesoObjeto(o: Objeto, contenidoCaja = 0): number {
  switch (o.tipo) {
    case 'cubos':
      return o.cantidad;
    case 'pesa':
      return o.valor;
    case 'caja':
      return contenidoCaja;
  }
}

export function pesoPlatillo(objetos: readonly Objeto[], contenidoCaja = 0): number {
  return objetos.reduce((s, o) => s + pesoObjeto(o, contenidoCaja), 0);
}

/** Lado que baja dados los pesos de cada platillo. */
export function inclinacionDe(izquierda: number, derecha: number): Inclinacion {
  if (izquierda > derecha) return 'izquierda';
  if (derecha > izquierda) return 'derecha';
  return 'equilibrio';
}

/**
 * Ángulo del brazo en grados. Positivo = baja la derecha (sentido horario
 * en pantalla), negativo = baja la izquierda.
 */
export function anguloBrazo(izquierda: number, derecha: number): number {
  const dif = derecha - izquierda;
  if (dif === 0) return 0;
  const proporcion = Math.min(Math.abs(dif), DIFERENCIA_TOPE) / DIFERENCIA_TOPE;
  const angulo = ANGULO_MINIMO + (ANGULO_MAXIMO - ANGULO_MINIMO) * proporcion;
  return Math.sign(dif) * angulo;
}

/** Magnitud cualitativa de una diferencia (lo que el servidor revela al pesar). */
export function magnitudDe(diferencia: number): ResultadoPesada['magnitud'] {
  const d = Math.abs(diferencia);
  if (d === 0) return 'nada';
  if (d <= 2) return 'poco';
  if (d <= 5) return 'medio';
  return 'mucho';
}

/** Ángulo representativo de una magnitud (para animar sin conocer el valor exacto). */
export function anguloDeMagnitud(inclinacion: Inclinacion, magnitud: ResultadoPesada['magnitud']): number {
  if (inclinacion === 'equilibrio' || magnitud === 'nada') return 0;
  const base = magnitud === 'poco' ? 7 : magnitud === 'medio' ? 13 : ANGULO_MAXIMO;
  return inclinacion === 'derecha' ? base : -base;
}

export function signoEntre(izquierda: number, derecha: number): Signo {
  return izquierda < derecha ? '<' : izquierda > derecha ? '>' : '=';
}

export const inclinacionASigno = (i: Inclinacion): Signo =>
  i === 'izquierda' ? '>' : i === 'derecha' ? '<' : '=';

// ---------------------------------------------------------------------------
// Expresiones
// ---------------------------------------------------------------------------

export const mas = (valor: number): Termino => ({ valor, signo: 1 });
export const menos = (valor: number): Termino => ({ valor, signo: -1 });

/** Expresión formada solo por sumas. */
export const suma = (...valores: number[]): Expresion => valores.map(mas);

export function valorExpresion(e: Expresion): number {
  return e.reduce((s, t) => s + t.signo * t.valor, 0);
}

/** Texto con signos tipográficos: "8 + 5 − 2". */
export function textoExpresion(e: Expresion): string {
  return e
    .map((t, i) => {
      if (i === 0) return t.signo === 1 ? String(t.valor) : `−${t.valor}`;
      return `${t.signo === 1 ? '+' : '−'} ${t.valor}`;
    })
    .join(' ');
}

/** Texto para leer en voz alta. */
export function vozExpresion(e: Expresion): string {
  return e
    .map((t, i) => {
      if (i === 0) return t.signo === 1 ? String(t.valor) : `menos ${t.valor}`;
      return `${t.signo === 1 ? 'más' : 'menos'} ${t.valor}`;
    })
    .join(' ');
}

export const vozSigno = (s: Signo): string =>
  s === '<' ? 'es menor que' : s === '>' ? 'es mayor que' : 'es igual a';

/** Expresión que describe un platillo, con "□" para la caja. */
export function textoPlatillo(objetos: readonly Objeto[], contenidoCaja?: number): string {
  if (objetos.length === 0) return '0';
  return objetos
    .map((o) => {
      if (o.tipo === 'caja') return contenidoCaja === undefined ? '□' : String(contenidoCaja);
      return String(pesoObjeto(o));
    })
    .join(' + ');
}

/** Objetos de un platillo a partir de valores (cubos o pesas). */
export function objetosDesde(valores: readonly number[], como: 'cubos' | 'pesa'): Objeto[] {
  return valores.map((v, i) => (como === 'cubos' ? { tipo: 'cubos', cantidad: v, color: i } : { tipo: 'pesa', valor: v }));
}

/** Descripción en voz de un platillo. */
export function vozPlatillo(objetos: readonly Objeto[]): string {
  if (objetos.length === 0) return 'nada';
  return objetos
    .map((o) => {
      if (o.tipo === 'caja') return 'la caja misteriosa';
      if (o.tipo === 'pesa') return `una pesa de ${o.valor}`;
      return o.cantidad === 1 ? '1 cubo' : `${o.cantidad} cubos`;
    })
    .join(' y ');
}
