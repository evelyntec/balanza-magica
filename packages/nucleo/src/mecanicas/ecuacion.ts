/**
 * "La caja misteriosa" — ecuaciones de un paso.
 * OA MA03-13: resolver ecuaciones de un paso que involucren adiciones y
 * sustracciones y un símbolo geométrico que represente un número
 * desconocido, en forma pictórica y simbólica del 0 al 100.
 *
 * Representaciones: balanza (con "quitar de ambos lados"), modelo de
 * barras (parte-parte-todo, como en Sumo Primero) y solo símbolos.
 * La respuesta se escribe: no se puede adivinar entre alternativas.
 */

import type { Azar } from '../azar';
import { esEnteroEn, type ContextoGeneracion, type ItemGenerado, type Mecanica } from './mecanica';

export type FormaEcuacion = 'x+a=b' | 'a+x=b' | 'b=x+a' | 'x-a=b' | 'a-x=b' | 'b=a-x';

export const SIMBOLOS = ['□', '△', '○', '☆', '◇'] as const;
export const NOMBRE_SIMBOLO: Record<string, string> = { '□': 'cuadrado', '△': 'triángulo', '○': 'círculo', '☆': 'estrella', '◇': 'rombo' };

export interface PublicoEcuacion {
  forma: FormaEcuacion;
  a: number;
  b: number;
  simbolo: string;
  representacion: 'balanza' | 'barra' | 'simbolica';
}

export interface SecretoEcuacion {
  x: number;
}

/** Texto de la ecuación con signos tipográficos. */
export function textoEcuacion(p: Pick<PublicoEcuacion, 'forma' | 'a' | 'b' | 'simbolo'>, x?: number): string {
  const s = x === undefined ? p.simbolo : String(x);
  switch (p.forma) {
    case 'x+a=b':
      return `${s} + ${p.a} = ${p.b}`;
    case 'a+x=b':
      return `${p.a} + ${s} = ${p.b}`;
    case 'b=x+a':
      return `${p.b} = ${s} + ${p.a}`;
    case 'x-a=b':
      return `${s} − ${p.a} = ${p.b}`;
    case 'a-x=b':
      return `${p.a} − ${s} = ${p.b}`;
    case 'b=a-x':
      return `${p.b} = ${p.a} − ${s}`;
  }
}

export const esSuma = (f: FormaEcuacion): boolean => f === 'x+a=b' || f === 'a+x=b' || f === 'b=x+a';

/** Valor de la incógnita según la forma. */
export function resolver(forma: FormaEcuacion, a: number, b: number): number {
  if (esSuma(forma)) return b - a;
  if (forma === 'x-a=b') return a + b;
  return a - b;
}

/** Respuesta que da quien aplica la operación equivocada (no la inversa). */
function operacionEquivocada(forma: FormaEcuacion, a: number, b: number): number {
  if (esSuma(forma)) return a + b;
  if (forma === 'x-a=b') return Math.abs(b - a);
  return a + b;
}

/** ¿La resta b − a necesita canje (reserva)? */
const conReserva = (mayor: number, menor: number) => mayor % 10 < menor % 10;

function generarNumeros(nivel: number, azar: Azar): { forma: FormaEcuacion; a: number; b: number; representacion: PublicoEcuacion['representacion'] } {
  for (let intento = 0; intento < 500; intento++) {
    let forma: FormaEcuacion;
    let representacion: PublicoEcuacion['representacion'];
    let tope: number;
    let reserva: boolean | null;
    switch (nivel) {
      case 1:
        forma = 'x+a=b';
        representacion = 'balanza';
        tope = 40;
        reserva = false;
        break;
      case 2:
        forma = azar.elegir(['a+x=b', 'b=x+a'] as const);
        representacion = 'balanza';
        tope = 70;
        reserva = false;
        break;
      case 3:
        forma = azar.elegir(['x+a=b', 'a+x=b', 'b=x+a'] as const);
        representacion = 'barra';
        tope = 100;
        reserva = true;
        break;
      case 4:
        forma = 'x-a=b';
        representacion = 'barra';
        tope = 100;
        reserva = null;
        break;
      default:
        forma = azar.elegir(['a-x=b', 'b=a-x', 'x-a=b', 'b=x+a'] as const);
        representacion = 'simbolica';
        tope = 100;
        reserva = true;
    }
    // x, a, b entre 1 y el tope; todas las cantidades del problema ≤ tope.
    let a: number;
    let b: number;
    let x: number;
    if (esSuma(forma)) {
      b = azar.entero(12, tope);
      a = azar.entero(2, b - 2);
      x = b - a;
      if (reserva !== null && conReserva(b, a) !== reserva) continue;
    } else if (forma === 'x-a=b') {
      x = azar.entero(15, tope);
      a = azar.entero(2, x - 2);
      b = x - a;
      if (reserva !== null && conReserva(x, a) !== reserva) continue;
    } else {
      a = azar.entero(15, tope);
      x = azar.entero(2, a - 2);
      b = a - x;
      if (reserva !== null && conReserva(a, x) !== reserva) continue;
    }
    if (a === b || x === a) continue; // evita ecuaciones que se resuelven "copiando"
    return { forma, a, b, representacion };
  }
  return { forma: 'x+a=b', a: 12, b: 30, representacion: 'balanza' };
}

export const ecuacion: Mecanica<PublicoEcuacion, SecretoEcuacion, number> = {
  tipo: 'ecuacion',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar, ctx?: ContextoGeneracion): ItemGenerado<PublicoEcuacion, SecretoEcuacion> {
    // En 4° básico se parte desde las formas más exigentes de 3°.
    const dificultad = (ctx?.isla ?? 3) >= 4 ? Math.min(5, nivel + 2) : nivel;
    const { forma, a, b, representacion } = generarNumeros(dificultad, azar);
    const simbolo = azar.elegir(SIMBOLOS);
    const publico: PublicoEcuacion = { forma, a, b, simbolo, representacion };
    const x = resolver(forma, a, b);
    return {
      tipo: 'ecuacion',
      nivel,
      consigna: `¿Qué número se esconde en el ${NOMBRE_SIMBOLO[simbolo]}?`,
      voz: `Resuelve: ${textoEcuacion(publico)}. ¿Qué número se esconde en el ${NOMBRE_SIMBOLO[simbolo]}?`,
      publico,
      secreto: { x },
      relacional: false,
    };
  },

  validarRespuesta(r: unknown): number | null {
    return esEnteroEn(r, 0, 999) ? r : null;
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    if (respuesta === secreto.x) {
      return { correcto: true, mensaje: `¡Exacto! ${publico.simbolo} = ${secreto.x}. Comprobamos: ${textoEcuacion(publico, secreto.x)} ✔`, solucion };
    }
    const comprobacion = `Comprueba: si ${publico.simbolo} fuera ${respuesta}, quedaría ${textoEcuacion(publico, respuesta)}. ¿Es verdad?`;
    if (respuesta === operacionEquivocada(publico.forma, publico.a, publico.b)) {
      return {
        correcto: false,
        diagnostico: 'operacion_inversa',
        mensaje: `${esSuma(publico.forma) ? 'Sumaste, pero había que restar' : publico.forma === 'x-a=b' ? 'Restaste, pero había que sumar' : 'Sumaste, pero había que restar'}. Usa la operación inversa. ${comprobacion}`,
        solucion,
      };
    }
    if (Math.abs(respuesta - secreto.x) === 10) {
      return { correcto: false, diagnostico: 'error_decena', mensaje: `Te equivocaste en las decenas (¿un canje?). ${comprobacion}`, solucion };
    }
    if (Math.abs(respuesta - secreto.x) <= 2) {
      return { correcto: false, diagnostico: 'generico', mensaje: `¡Muy cerca! Revisa el cálculo. ${comprobacion}`, solucion };
    }
    return { correcto: false, diagnostico: 'generico', mensaje: comprobacion, solucion };
  },

  solucion(publico, secreto) {
    const { a, b, forma } = publico;
    const calculo = esSuma(forma) ? `${b} − ${a} = ${secreto.x}` : forma === 'x-a=b' ? `${b} + ${a} = ${secreto.x}` : `${a} − ${b} = ${secreto.x}`;
    return {
      simbolico: `${publico.simbolo} = ${secreto.x}   (${textoEcuacion(publico, secreto.x)})`,
      explicacion: `Con la operación inversa: ${calculo}.`,
      respuesta: secreto.x,
    };
  },

  pistas(publico) {
    const { a, b, forma, simbolo } = publico;
    const texto1 = esSuma(forma)
      ? `¿Qué número sumado con ${a} da ${b}? Si sacas ${a} de los dos lados, ${simbolo} queda solo.`
      : forma === 'x-a=b'
        ? `A ${simbolo} le quitaron ${a} y quedó ${b}. ¿Cuánto había antes de quitar?`
        : `A ${a} le quitaron ${simbolo} y quedó ${b}. ¿Cuánto se quitó?`;
    return [
      { nivel: 1, texto: texto1 },
      { nivel: 2, texto: 'Mira el modelo de barras: la barra de arriba es el total y abajo están sus partes.', ayudaVisual: 'modeloBarra' },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: esSuma(forma)
          ? { texto: '□ + 25 = 60', pasos: ['El total es 60 y una parte es 25.', 'La otra parte es 60 − 25 = 35.', 'Comprobamos: 35 + 25 = 60 ✔'] }
          : { texto: '□ − 18 = 40', pasos: ['A □ le quitaron 18 y quedó 40.', 'Antes había 40 + 18 = 58.', 'Comprobamos: 58 − 18 = 40 ✔'] },
      },
    ];
  },
};
